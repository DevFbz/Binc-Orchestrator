from report_engine import scope_report_data


def test_report_scope_filters_projects_and_non_instagram_campaigns():
    projects = [{"project_id": "instagram-content-operations"}, {"project_id": "cofrinia-finance"}]
    campaigns = [{"campaign_id": "c1"}, {"campaign_id": "c2"}]
    scoped_projects, scoped_campaigns = scope_report_data(projects, campaigns, "cofrinia-finance")
    assert scoped_projects == [projects[1]]
    assert scoped_campaigns == []


def test_report_scope_keeps_all_data_without_project_filter():
    projects = [{"project_id": "p1"}]
    campaigns = [{"campaign_id": "c1"}]
    assert scope_report_data(projects, campaigns, "") == (projects, campaigns)
