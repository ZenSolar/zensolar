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
import { template as vipAccessAlert } from './vip-access-alert.tsx'
import { template as demoAttendeesReport } from './demo-attendees-report.tsx'
import { template as mintAccessRequest } from './mint-access-request.tsx'
import { template as julianPixelInvite } from './julian-pixel-invite.tsx'
import { template as tobyIphoneInvite } from './toby-iphone-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'nda-signed-copy': ndaSignedCopy,
  'nda-admin-notification': ndaAdminNotification,
  'user-feedback': userFeedback,
  'demo-followup': demoFollowup,
  'vip-access-alert': vipAccessAlert,
  'demo-attendees-report': demoAttendeesReport,
  'mint-access-request': mintAccessRequest,
  'julian-pixel-invite': julianPixelInvite,
  'toby-iphone-invite': tobyIphoneInvite,
}
