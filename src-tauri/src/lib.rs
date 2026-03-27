#[tauri::command]
fn set_badge(count: u64) {
    #[cfg(target_os = "macos")]
    {
        use std::ffi::CString;
        #[allow(unused_imports)]
        use objc::{msg_send, sel, sel_impl, class};
        let label = if count == 0 { String::new() } else { count.to_string() };
        unsafe {
            let app: *mut objc::runtime::Object = msg_send![class!(NSApplication), sharedApplication];
            let dock_tile: *mut objc::runtime::Object = msg_send![app, dockTile];
            let badge_str: *mut objc::runtime::Object = if label.is_empty() {
                msg_send![class!(NSString), string]
            } else {
                let c = CString::new(label).unwrap();
                msg_send![class!(NSString), stringWithUTF8String: c.as_ptr()]
            };
            let _: () = msg_send![dock_tile, setBadgeLabel: badge_str];
        }
    }
    #[cfg(not(target_os = "macos"))]
    let _ = count;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_badge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
