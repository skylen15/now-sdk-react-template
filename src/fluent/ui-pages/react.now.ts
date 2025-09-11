import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import incidentPage from "../../client/index.html"

UiPage({
    $id: Now.ID['react_app_example'],
    endpoint: 'x_707440_react_app_example.do',
    description: 'Incident Response Manager UI Page',
    category: 'general',
    html: incidentPage,
    direct: true,
})