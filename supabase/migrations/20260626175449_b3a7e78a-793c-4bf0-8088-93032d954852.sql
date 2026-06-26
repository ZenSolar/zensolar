update connected_devices
set lifetime_totals = lifetime_totals || jsonb_build_object('lifetime_fsd_miles', 0, 'lifetime_fsd_miles_calc', 0),
    last_known_state = coalesce(last_known_state, '{}'::jsonb) || jsonb_build_object(
      'fsd_accumulator', jsonb_build_object(
        'engaged', false,
        'in_drive', false,
        'last_event_at', null,
        'last_odometer', 75499.611474,
        'supervised_miles', 0,
        'unsupervised_miles', 0
      )
    )
where device_id = '5YJXCBE24MF323843' and provider = 'tesla';