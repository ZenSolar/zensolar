INSERT INTO public.page_cleanup_flags (route, action, flagged_by, note, status) VALUES
('/founders/lyndon-pitch-v2','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/founders/seed-pitch-companion-deck','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/founders/spacex','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/founders/app-overhaul','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/founders/catchup','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/admin/coffee-pitch','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/admin/investor-pitch','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending'),
('/admin/investor-one-pager','archive','331c79de-0c05-433c-a57e-9cdfcf2dc44d','Superseded by /investor/pitch — Investor Pitch v2','pending')
ON CONFLICT (route) DO UPDATE SET action='archive', note=EXCLUDED.note, status='pending', updated_at=now();