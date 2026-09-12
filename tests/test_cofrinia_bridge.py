from control_plane_server import cofrinia_health_status


class FakeResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return b'{"status":"ok"}'


def test_cofrinia_bridge_health_accepts_healthy_response():
    result = cofrinia_health_status("http://127.0.0.1:8790", opener=lambda request, timeout: FakeResponse())

    assert result == {"service": "cofrinia-hermes-bridge", "status": "operational"}


def test_cofrinia_bridge_health_marks_unavailable_bridge_as_failed():
    def failing_opener(request, timeout):
        raise OSError("bridge indisponível")

    result = cofrinia_health_status("http://127.0.0.1:8790", opener=failing_opener)

    assert result == {"service": "cofrinia-hermes-bridge", "status": "failed"}
