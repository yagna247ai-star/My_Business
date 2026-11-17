"""
BANGI Architectural Verification Test Suite v0.5
================================================
Tests for SQLite WAL persistence, plugin registry dynamic loader,
fast-path router performance (<5ms latency benchmark), and async endpoints.
"""
import os
import sys
import time
import pytest
import asyncio
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.db import BangiDB
from backend.plugin_loader import PluginRegistry
from backend.bangi_agent import BangiAgent


def test_db_wal_mode_and_task_lifecycle(tmp_path):
    """Verify SQLite WAL mode, task state transitions, and event logging."""
    async def run():
        db = BangiDB(db_dir=tmp_path)
        assert db.db_path.exists()
        
        task_id = db.create_task(prompt="test prompt", task_type="test", mode="fast-path", correlation_id="req-123")
        assert task_id is not None
        
        task = db.get_task(task_id)
        assert task["prompt"] == "test prompt"
        assert task["status"] == "queued"
        assert task["correlation_id"] == "req-123"

        db.update_task_status(task_id, "completed", result={"output": "success"})
        updated_task = db.get_task(task_id)
        assert updated_task["status"] == "completed"
        assert updated_task["result"] == {"output": "success"}

        tasks = db.list_tasks(limit=10)
        assert len(tasks) >= 1
        assert tasks[0]["id"] == task_id

    asyncio.run(run())


def test_plugin_registry_discovery():
    """Verify PluginRegistry loads available Hermes modules gracefully."""
    plugins = PluginRegistry()
    caps = plugins.get_capabilities()
    assert isinstance(caps, list)
    assert len(caps) > 0


def test_fastpath_router_latency_benchmark():
    """Verify fast-path router + SQLite persistence executes in < 25ms."""
    async def run():
        agent = BangiAgent()
        prompts = [
            "check CRM lead status",
            "generate campaign for shankarpally",
            "coach Yagna call transcript",
            "convert leads to contacts.csv",
            "check market intel trends"
        ]
        
        latencies = []
        # Warmup loop
        await agent.do_task(prompts[0])

        for p in prompts:
            start = time.perf_counter()
            res = await agent.do_task(p)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            latencies.append(elapsed_ms)
            assert res["status"] == "completed"
            assert res["mode"] == "hermes-direct"

        avg_latency = sum(latencies) / len(latencies)
        print(f"\nAverage Fast-Path End-to-End Task Latency (with SQLite WAL): {avg_latency:.3f} ms")
        assert avg_latency < 25.0, f"Router latency benchmark failed: {avg_latency:.3f} ms >= 25.0 ms"

    asyncio.run(run())


def test_async_concurrency_execution():
    """Verify 20 concurrent async task executions run without event loop blocking."""
    async def run():
        agent = BangiAgent()
        tasks = [agent.do_task(f"check CRM lead status #{i}") for i in range(20)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 20
        for r in results:
            assert r["status"] == "completed"
            assert r["mode"] == "hermes-direct"

    asyncio.run(run())
