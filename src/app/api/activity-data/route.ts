import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

interface ClientRow {
  id: string;
  name: string;
  uciNumber: string;
  dob: string;
  address: string;
  referralSource: string;
  cordinatorName: string;
  goals: unknown;
}

interface ActivityRow {
  id: string;
  clientId: string;
  date: string;
  activity: string;
  notes: string | null;
  goalValues: unknown;
}

interface ActivityRequest {
  type: 'activity';
  id: string;
  clientId: string;
  date: string;
  activity: string;
  notes?: string;
  goalValues: Record<string, string>;
}

interface GoalRequest {
  type: 'goal';
  clientId: string;
  goal: string;
}

interface DeleteRequest {
  type: 'activity' | 'goal';
  id?: string;
  clientId?: string;
  goal?: string;
}

type ActivityDataRequest = Partial<ActivityRequest> | Partial<GoalRequest>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const getGoalValues = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};

  const values: Record<string, string> = {};
  Object.entries(value).forEach(([goal, goalValue]) => {
    if (goal.trim() && typeof goalValue === 'string' && goalValue.trim()) {
      values[goal] = goalValue.trim();
    }
  });
  return values;
};

export async function GET() {
  try {
    await sql`
      DELETE FROM activities
      WHERE activity_date < CURRENT_DATE - INTERVAL '1 year'
    `;

    const [clientRows, activityRows] = await Promise.all([
      sql`
        SELECT
          c.id,
          c.name,
          c.uci_number AS "uciNumber",
          c.dob,
          c.address,
          c.referral_source AS "referralSource",
          c.coordinator_name AS "cordinatorName",
          COALESCE(
            json_agg(g.name ORDER BY g.sort_order) FILTER (WHERE g.name IS NOT NULL),
            '[]'::json
          ) AS goals
        FROM clients c
        LEFT JOIN client_goals g ON g.client_id = c.id
        GROUP BY c.id
        ORDER BY c.name
      `,
      sql`
        SELECT
          a.id,
          a.client_id AS "clientId",
          a.activity_date::text AS date,
          a.activity,
          a.notes,
          COALESCE(
            json_object_agg(v.goal_name, v.value) FILTER (WHERE v.goal_name IS NOT NULL),
            '{}'::json
          ) AS "goalValues"
        FROM activities a
        LEFT JOIN activity_goal_values v ON v.activity_id = a.id
        WHERE a.activity_date >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY a.id
        ORDER BY a.activity_date DESC, a.created_at DESC
      `,
    ]);

    const clients = (clientRows as unknown as ClientRow[]).map((client) => ({
      ...client,
      goals: Array.isArray(client.goals) ? client.goals : [],
    }));
    const activities = (activityRows as unknown as ActivityRow[]).map((activity) => ({
      ...activity,
      notes: activity.notes ?? undefined,
      goalValues: getGoalValues(activity.goalValues),
    }));

    return NextResponse.json({ clients, activities });
  } catch (error) {
    console.error('Failed to load activity data', error);
    return NextResponse.json(
      { error: 'The activity database is not ready. Run the database migration first.' },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActivityDataRequest;

    if (body.type === 'goal') {
      const clientId = getString(body.clientId);
      const goal = getString(body.goal);
      if (!clientId || !goal) {
        return NextResponse.json({ error: 'Client and goal are required.' }, { status: 400 });
      }

      await sql`
        INSERT INTO client_goals (client_id, name, sort_order)
        VALUES (
          ${clientId},
          ${goal},
          COALESCE((SELECT MAX(sort_order) + 1 FROM client_goals WHERE client_id = ${clientId}), 0)
        )
        ON CONFLICT (client_id, name) DO NOTHING
      `;
      return NextResponse.json({ success: true });
    }

    if (body.type === 'activity') {
      const id = getString(body.id);
      const clientId = getString(body.clientId);
      const date = getString(body.date);
      const activity = getString(body.activity);
      const goalValues = getGoalValues(body.goalValues);

      if (!id || !clientId || !date || (!activity && Object.keys(goalValues).length === 0)) {
        return NextResponse.json({ error: 'Date and activity data are required.' }, { status: 400 });
      }

      const statements = [
        sql`
          INSERT INTO activities (id, client_id, activity_date, activity, notes)
          VALUES (${id}, ${clientId}, ${date}, ${activity}, ${getString(body.notes) || null})
        `,
        ...Object.entries(goalValues).map(
          ([goal, value]) => sql`
            INSERT INTO activity_goal_values (activity_id, goal_name, value)
            VALUES (${id}, ${goal}, ${value})
          `,
        ),
      ];
      await sql.transaction(statements);

      return NextResponse.json({
        activity: { id, clientId, date, activity, goalValues, notes: getString(body.notes) || undefined },
      });
    }

    return NextResponse.json({ error: 'Unsupported activity data request.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to save activity data', error);
    return NextResponse.json({ error: 'Unable to save activity data.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteRequest;

    if (body.type === 'activity' && body.id) {
      await sql`DELETE FROM activities WHERE id = ${body.id}`;
      return NextResponse.json({ success: true });
    }

    if (body.type === 'goal' && body.clientId && body.goal) {
      await sql`
        DELETE FROM client_goals
        WHERE client_id = ${body.clientId} AND name = ${body.goal}
      `;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'A valid activity or goal is required.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete activity data', error);
    return NextResponse.json({ error: 'Unable to delete activity data.' }, { status: 500 });
  }
}