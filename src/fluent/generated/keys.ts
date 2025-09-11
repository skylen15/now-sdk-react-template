import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '391c7053a76d4a36bdb4b53409bcd438'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '3bb4be58f3734ea88a51f9eb3e02f6a0'
                    }
                    react_app_example: {
                        table: 'sys_ui_page'
                        id: '30a1aa6cb63b40e1957dce87af1a0f44'
                    }
                    src_server_script_ts: {
                        table: 'sys_module'
                        id: '8a13f4d1b8c74751a7cd42fe9f2a0286'
                    }
                    'theme.css': {
                        table: 'sys_ux_theme_asset'
                        id: 'e1b6ce8a409e40c5b2a456b89dd05635'
                        deleted: true
                    }
                    'x_707440_react_app/assets/tailwind.browser': {
                        table: 'sys_ux_lib_asset'
                        id: '82ebc0856da643cc8af9a3a37937d095'
                    }
                    'x_707440_react_app/assets/tailwind.browser.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '2d314dc7ea934735a9b53bc46755c6d9'
                    }
                    'x_707440_react_app/main': {
                        table: 'sys_ux_lib_asset'
                        id: '779c0013ce884dc196717446e8d19c97'
                    }
                    'x_707440_react_app/main.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '5ce4bb699bcc4bf699b305083e0400e0'
                    }
                }
            }
        }
    }
}
