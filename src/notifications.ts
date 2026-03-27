import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Task } from './types';
import { isToday, isPast, parseISO } from 'date-fns';

const NOTIFIED_KEY = 'mydaypal-notified';

function getNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markNotified(id: string) {
  const set = getNotified();
  set.add(id);
  // Only keep last 200 to prevent unbounded growth
  const arr = Array.from(set).slice(-200);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
}

function notifKey(task: Task, type: 'due' | 'overdue') {
  // Reset daily so overdue tasks remind every day
  const day = new Date().toDateString();
  return `${task.id}-${type}-${day}`;
}

export async function checkAndNotify(tasks: Task[]) {
  let permitted = await isPermissionGranted();
  if (!permitted) {
    const result = await requestPermission();
    permitted = result === 'granted';
  }
  if (!permitted) return;

  const notified = getNotified();
  const dueTasks: Task[] = [];
  const overdueTasks: Task[] = [];

  for (const task of tasks) {
    if (task.status === 'done' || !task.dueDate) continue;
    const due = parseISO(task.dueDate);

    if (isToday(due)) {
      const key = notifKey(task, 'due');
      if (!notified.has(key)) {
        dueTasks.push(task);
        markNotified(key);
      }
    } else if (isPast(due)) {
      const key = notifKey(task, 'overdue');
      if (!notified.has(key)) {
        overdueTasks.push(task);
        markNotified(key);
      }
    }
  }

  // Send due-today notification
  if (dueTasks.length === 1) {
    sendNotification({
      title: 'Due Today',
      body: `"${dueTasks[0].title}" is due today`,
    });
  } else if (dueTasks.length > 1) {
    sendNotification({
      title: 'Tasks Due Today',
      body: `${dueTasks.length} tasks are due today`,
    });
  }

  // Send overdue notification
  if (overdueTasks.length === 1) {
    sendNotification({
      title: 'Overdue Task',
      body: `"${overdueTasks[0].title}" is overdue`,
    });
  } else if (overdueTasks.length > 1) {
    sendNotification({
      title: 'Overdue Tasks',
      body: `${overdueTasks.length} tasks are overdue`,
    });
  }

  // Update dock badge with total urgent count
  const urgentCount = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const due = parseISO(t.dueDate);
    return isToday(due) || isPast(due);
  }).length;

  try {
    const win = getCurrentWindow();
    await win.setBadgeLabel(urgentCount > 0 ? String(urgentCount) : undefined);
  } catch {
    // Silently fail if not supported
  }
}
