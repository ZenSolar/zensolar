/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as ndaSignedCopy } from './nda-signed-copy.tsx'
import { template as ndaAdminNotification } from './nda-admin-notification.tsx'
import { template as userFeedback } from './user-feedback.tsx'
import { template as demoFollowup } from './demo-followup.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'nda-signed-copy': ndaSignedCopy,
  'nda-admin-notification': ndaAdminNotification,
  'user-feedback': userFeedback,
  'demo-followup': demoFollowup,
}
