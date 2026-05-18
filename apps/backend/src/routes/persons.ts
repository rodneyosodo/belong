import { Elysia } from 'elysia';

import { auth } from '../lib/auth';
import { pool } from '../lib/db';

async function getSession(context: { request: { headers: Headers } }) {
  return auth.api.getSession({ headers: context.request.headers });
}

async function checkAccess(
  context: { request: { headers: Headers } },
  organizationId: string,
  requireWrite: boolean,
) {
  const session = await getSession(context);

  if (session?.user?.id) {
    const org = await auth.api.getFullOrganization({
      query: { organizationId },
      headers: context.request.headers,
    });
    if (!org) return null;

    const isMember = (org as any).members?.some((m: any) => m.userId === session.user!.id);
    if (!isMember && !(org as any).isPublic) return null;

    return { session, org, isMember };
  }

  if (requireWrite) return null;

  const { rows } = await pool.query(`SELECT "isPublic" FROM organization WHERE id = $1`, [
    organizationId,
  ]);
  if (rows.length === 0 || !rows[0].isPublic) return null;

  return { session: null, org: null, isMember: false };
}

async function fetchPersonById(pool: any, personId: string) {
  const { rows } = await pool.query(
    `SELECT id, organization_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata, created_at, updated_at FROM persons WHERE id = $1`,
    [personId],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    tree_id: r.organization_id,
    first_name: r.first_name,
    last_name: r.last_name,
    gender: r.gender,
    date_of_birth: r.birth_date,
    date_of_death: r.death_date,
    bio: r.bio,
    avatar_url: r.avatar_url,
    is_deceased: r.is_deceased,
    metadata: r.metadata,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export const personRoutes = new Elysia({ prefix: '/api/trees' })
  .get('/:id/persons', async (context) => {
    const treeId = (context.params as { id: string }).id;
    const result = await checkAccess(context, treeId, false);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { rows } = await pool.query(
      `SELECT id, organization_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata, created_at, updated_at FROM persons WHERE organization_id = $1`,
      [treeId],
    );

    return rows.map((r: any) => ({
      id: r.id,
      tree_id: r.organization_id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      date_of_birth: r.birth_date,
      date_of_death: r.death_date,
      bio: r.bio,
      avatar_url: r.avatar_url,
      is_deceased: r.is_deceased,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  })
  .post('/:id/persons', async (context) => {
    const treeId = (context.params as { id: string }).id;
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      first_name?: string;
      last_name?: string;
      gender?: string;
      date_of_birth?: string;
      date_of_death?: string;
      bio?: string;
      avatar_url?: string;
      is_deceased?: boolean;
      metadata?: any;
    };

    const { rows } = await pool.query(
      `INSERT INTO persons (organization_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        treeId,
        body.first_name ?? '',
        body.last_name ?? '',
        body.gender ?? '',
        body.date_of_birth ?? '',
        body.date_of_death ?? '',
        body.bio ?? '',
        body.avatar_url ?? '',
        body.is_deceased ?? false,
        JSON.stringify(body.metadata ?? {}),
      ],
    );

    const r = rows[0];
    return {
      id: r.id,
      tree_id: r.organization_id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      date_of_birth: r.birth_date,
      date_of_death: r.death_date,
      bio: r.bio,
      avatar_url: r.avatar_url,
      is_deceased: r.is_deceased,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  })
  .put('/:id/persons/:personId', async (context) => {
    const { id: treeId, personId } = context.params as { id: string; personId: string };
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      first_name?: string;
      last_name?: string;
      gender?: string;
      date_of_birth?: string;
      date_of_death?: string;
      bio?: string;
      avatar_url?: string;
      is_deceased?: boolean;
      metadata?: any;
    };

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries({
      first_name: 'first_name',
      last_name: 'last_name',
      gender: 'gender',
      date_of_birth: 'birth_date',
      date_of_death: 'death_date',
      bio: 'bio',
      avatar_url: 'avatar_url',
      is_deceased: 'is_deceased',
    })) {
      if ((body as any)[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push((body as any)[key]);
      }
    }

    if (body.metadata !== undefined) {
      sets.push(`metadata = $${idx++}`);
      values.push(JSON.stringify(body.metadata));
    }

    if (sets.length === 0) {
      context.set.status = 400;
      return { error: 'No fields to update' };
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(personId, treeId);

    const { rows } = await pool.query(
      `UPDATE persons SET ${sets.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx++} RETURNING *`,
      values,
    );

    if (rows.length === 0) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const r = rows[0];
    return {
      id: r.id,
      tree_id: r.organization_id,
      first_name: r.first_name,
      last_name: r.last_name,
      gender: r.gender,
      date_of_birth: r.birth_date,
      date_of_death: r.death_date,
      bio: r.bio,
      avatar_url: r.avatar_url,
      is_deceased: r.is_deceased,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  })
  .delete('/:id/persons/:personId', async (context) => {
    const { id: treeId, personId } = context.params as { id: string; personId: string };
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    await pool.query(`DELETE FROM persons WHERE id = $1 AND organization_id = $2`, [
      personId,
      treeId,
    ]);

    return { success: true };
  })
  .get('/:id/relationships', async (context) => {
    const treeId = (context.params as { id: string }).id;
    const result = await checkAccess(context, treeId, false);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { rows } = await pool.query(
      `SELECT id, organization_id, person_a_id, person_b_id, type, metadata, created_at FROM relationships WHERE organization_id = $1`,
      [treeId],
    );

    return rows.map((r: any) => ({
      id: r.id,
      tree_id: r.organization_id,
      person_a_id: r.person_a_id,
      person_b_id: r.person_b_id,
      type: r.type,
      metadata: r.metadata,
      created_at: r.created_at,
    }));
  })
  .post('/:id/relationships', async (context) => {
    const treeId = (context.params as { id: string }).id;
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      person_a_id: string;
      person_b_id: string;
      type: string;
      metadata?: any;
    };

    if (!body.person_a_id || !body.person_b_id || !body.type) {
      context.set.status = 400;
      return { error: 'person_a_id, person_b_id, and type are required' };
    }

    const { rows } = await pool.query(
      `INSERT INTO relationships (organization_id, person_a_id, person_b_id, type, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [treeId, body.person_a_id, body.person_b_id, body.type, JSON.stringify(body.metadata ?? {})],
    );

    const r = rows[0];
    return {
      id: r.id,
      tree_id: r.organization_id,
      person_a_id: r.person_a_id,
      person_b_id: r.person_b_id,
      type: r.type,
      metadata: r.metadata,
      created_at: r.created_at,
    };
  })
  .delete('/:id/relationships/:relationshipId', async (context) => {
    const { id: treeId, relationshipId } = context.params as { id: string; relationshipId: string };
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    await pool.query(`DELETE FROM relationships WHERE id = $1 AND organization_id = $2`, [
      relationshipId,
      treeId,
    ]);

    return { success: true };
  })
  .post('/:id/import', async (context) => {
    const treeId = (context.params as { id: string }).id;
    const result = await checkAccess(context, treeId, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      persons: {
        first_name: string;
        last_name: string;
        gender: string;
        date_of_birth: string;
        date_of_death: string;
        metadata?: any;
      }[];
      relationships: { person_a_id: number; person_b_id: number; type: string }[];
    };

    if (!body.persons?.length) {
      context.set.status = 400;
      return { error: 'No persons to import' };
    }

    const client = await pool.connect();
    try {
      await client.query('begin');

      const personIds: string[] = [];
      for (const p of body.persons) {
        const { rows } = await client.query(
          `INSERT INTO persons (organization_id, first_name, last_name, gender, birth_date, death_date, bio, avatar_url, is_deceased, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            treeId,
            p.first_name ?? '',
            p.last_name ?? '',
            p.gender ?? '',
            p.date_of_birth ?? '',
            p.date_of_death ?? '',
            '',
            '',
            !!p.date_of_death,
            JSON.stringify(p.metadata ?? {}),
          ],
        );
        personIds.push(rows[0].id);
      }

      for (const r of body.relationships) {
        const aIdx = r.person_a_id;
        const bIdx = r.person_b_id;
        if (aIdx < 0 || aIdx >= personIds.length || bIdx < 0 || bIdx >= personIds.length) continue;
        await client.query(
          `INSERT INTO relationships (organization_id, person_a_id, person_b_id, type, metadata) VALUES ($1, $2, $3, $4, $5)`,
          [treeId, personIds[aIdx], personIds[bIdx], r.type, JSON.stringify({})],
        );
      }

      await client.query('commit');
      return { success: true, person_count: personIds.length };
    } catch (err) {
      await client.query('rollback').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  });

export const singletonPersonRoutes = new Elysia({ prefix: '/api/persons' })
  .get('/:personId', async (context) => {
    const { personId } = context.params as { personId: string };
    const person = await fetchPersonById(pool, personId);
    if (!person) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const result = await checkAccess(context, person.tree_id, false);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    return person;
  });

export const eventRoutes = new Elysia({ prefix: '/api/persons' })
  .get('/:personId/events', async (context) => {
    const { personId } = context.params as { personId: string };
    const person = await fetchPersonById(pool, personId);
    if (!person) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const result = await checkAccess(context, person.tree_id, false);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { rows } = await pool.query(
      `SELECT id, person_id, type, title, date, description, metadata, created_at, updated_at FROM person_events WHERE person_id = $1 ORDER BY date ASC, created_at ASC`,
      [personId],
    );

    return rows.map((r: any) => ({
      id: r.id,
      person_id: r.person_id,
      type: r.type,
      title: r.title,
      date: r.date,
      description: r.description,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  })
  .post('/:personId/events', async (context) => {
    const { personId } = context.params as { personId: string };
    const person = await fetchPersonById(pool, personId);
    if (!person) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const result = await checkAccess(context, person.tree_id, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      type?: string;
      title?: string;
      date?: string;
      description?: string;
      metadata?: any;
    };

    if (!body.title?.trim()) {
      context.set.status = 400;
      return { error: 'Title is required' };
    }

    const { rows } = await pool.query(
      `INSERT INTO person_events (organization_id, person_id, type, title, date, description, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        person.tree_id,
        personId,
        body.type || 'custom',
        body.title.trim(),
        body.date || '',
        body.description || '',
        JSON.stringify(body.metadata ?? {}),
      ],
    );

    const r = rows[0];
    return {
      id: r.id,
      person_id: r.person_id,
      type: r.type,
      title: r.title,
      date: r.date,
      description: r.description,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  })
  .put('/:personId/events/:eventId', async (context) => {
    const { personId, eventId } = context.params as { personId: string; eventId: string };
    const person = await fetchPersonById(pool, personId);
    if (!person) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const result = await checkAccess(context, person.tree_id, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as {
      type?: string;
      title?: string;
      date?: string;
      description?: string;
      metadata?: any;
    };

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries({
      type: 'type',
      title: 'title',
      date: 'date',
      description: 'description',
    })) {
      if ((body as any)[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push((body as any)[key]);
      }
    }

    if (body.metadata !== undefined) {
      sets.push(`metadata = $${idx++}`);
      values.push(JSON.stringify(body.metadata));
    }

    if (sets.length === 0) {
      context.set.status = 400;
      return { error: 'No fields to update' };
    }

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(eventId, personId);

    const { rows } = await pool.query(
      `UPDATE person_events SET ${sets.join(', ')} WHERE id = $${idx++} AND person_id = $${idx++} RETURNING *`,
      values,
    );

    if (rows.length === 0) {
      context.set.status = 404;
      return { error: 'Event not found' };
    }

    const r = rows[0];
    return {
      id: r.id,
      person_id: r.person_id,
      type: r.type,
      title: r.title,
      date: r.date,
      description: r.description,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  })
  .delete('/:personId/events/:eventId', async (context) => {
    const { personId, eventId } = context.params as { personId: string; eventId: string };
    const person = await fetchPersonById(pool, personId);
    if (!person) {
      context.set.status = 404;
      return { error: 'Person not found' };
    }

    const result = await checkAccess(context, person.tree_id, true);
    if (!result) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    await pool.query(`DELETE FROM person_events WHERE id = $1 AND person_id = $2`, [
      eventId,
      personId,
    ]);

    return { success: true };
  });
