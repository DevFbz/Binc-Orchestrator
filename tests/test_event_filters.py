from event_store import filter_telegram_events


def test_filters_events_by_text_status_and_campaign():
    events = [
        {"event_id": "1", "text": "Quero o post do óleo", "delivery_status": "received", "campaign_id": "camp-1"},
        {"event_id": "2", "text": "Imagem aprovada", "delivery_status": "sent", "campaign_id": "camp-2"},
    ]
    assert [item["event_id"] for item in filter_telegram_events(events, query="óleo")] == ["1"]
    assert [item["event_id"] for item in filter_telegram_events(events, delivery_status="sent")] == ["2"]
    assert [item["event_id"] for item in filter_telegram_events(events, campaign_id="camp-1")] == ["1"]
