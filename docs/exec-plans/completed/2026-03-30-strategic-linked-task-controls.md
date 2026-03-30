# Strategic Linked Task Controls

## Goal

Let the weekly-first strategic planner directly manage the canonical task already linked to a goal, so simple bucket and weekly-focus changes do not require a context switch into the task board.

## Checklist

- extend `StrategicPlannerPanel` goal rows with direct controls for linked open tasks
- reuse existing planner actions (`SET_TASK_PLAN_BUCKET`, `CLEAR_TASK_PLAN_BUCKET`, `ADD_WEEKLY_FOCUS_TASK`, `REMOVE_WEEKLY_FOCUS_TASK`) instead of inventing a second strategic-planning state
- keep advisor locking and linked-task reuse behavior intact for promoted goals
- add regression coverage for bucket changes and weekly-focus toggles from the strategic planner row
- update durable docs if the planner surface or verification expectations change

## Acceptance Criteria

- an open linked task can move between `today`, `this week`, `later`, and unplanned directly from its strategic goal row
- weekly-focus add/remove actions from the strategic planner update the same canonical task used by the task board
- missing or completed linked tasks still show the existing re-promote guidance instead of the new controls
