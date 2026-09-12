from campaign_matcher import identify_campaigns


def campaign(campaign_id, name, caption):
    return {"campaign_id": campaign_id, "product_snapshot": {"name": name}, "caption": caption, "tenant_id": "magu-moto-pecas-filho"}


def test_exact_campaign_reference_has_high_confidence():
    result = identify_campaigns({"text": "aprovar campanha camp-1"}, [campaign("camp-1", "Óleo Mobil", "Post do óleo")])
    assert result[0]["campaign_id"] == "camp-1"
    assert result[0]["confidence"] == 1.0


def test_ambiguous_candidates_are_not_selected():
    campaigns = [campaign("camp-1", "Óleo Mobil", "Post sobre óleo para moto"), campaign("camp-2", "Óleo Motul", "Post sobre óleo para moto")]
    result = identify_campaigns({"text": "quero post sobre óleo para moto"}, campaigns)
    assert len(result) == 2
    assert all(item["selected"] is False for item in result)
