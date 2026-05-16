import { Elysia } from 'elysia';

import { auth } from '../lib/auth';
import { pool } from '../lib/db';

async function getSession(context: { request: { headers: Headers } }) {
  return auth.api.getSession({ headers: context.request.headers });
}

export const treeRoutes = new Elysia({ prefix: '/api/trees' })
  .get('/', async (context) => {
    const session = await getSession(context);
    if (!session?.user?.id) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const { rows: memberRows } = await pool.query(
      `SELECT m."organizationId", m."userId", m.role, o.name, o.slug, o."createdAt", o.metadata, o.description, o."coverImage", o."isPublic" FROM member m JOIN organization o ON o.id = m."organizationId" WHERE m."userId" = $1`,
      [session.user.id],
    );

    const orgMap = new Map<
      string,
      {
        name: string;
        slug: string;
        createdAt: string;
        description: string;
        coverImage: string;
        isPublic: boolean;
      }
    >();
    const roles = new Map<string, string>();
    for (const r of memberRows) {
      orgMap.set(r.organizationId, {
        name: r.name,
        slug: r.slug,
        createdAt: r.createdAt,
        description: r.description ?? '',
        coverImage: r.coverImage ?? '',
        isPublic: r.isPublic ?? false,
      });
      roles.set(r.organizationId, r.role);
    }

    const withCounts = await Promise.all(
      [...orgMap.entries()].map(async ([id, org]) => {
        const { rows } = await pool.query(
          `select count(*) as person_count from "persons" where "organization_id" = $1`,
          [id],
        );
        return {
          id,
          name: org.name,
          slug: org.slug,
          description: org.description,
          cover_image: org.coverImage,
          is_public: org.isPublic,
          created_at: org.createdAt,
          updated_at: org.createdAt,
          person_count: rows[0]?.person_count ?? '0',
        };
      }),
    );

    const owned = withCounts.filter((t) => roles.get(t.id) === 'owner');
    const shared = withCounts.filter((t) => roles.get(t.id) && roles.get(t.id) !== 'owner');

    return { owned, shared };
  })
  .post('/', async (context) => {
    const session = await getSession(context);
    if (!session?.user?.id) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = context.body as { name?: string; description?: string };
    const name = body?.name?.trim();
    if (!name) {
      context.set.status = 400;
      return { error: 'Tree name is required' };
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    const org = await auth.api.createOrganization({
      body: {
        name,
        slug,
        description: body?.description?.trim() ?? '',
        coverImage: '',
        isPublic: false,
      },
      headers: context.request.headers,
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: (org as any).description ?? '',
      cover_image: (org as any).coverImage ?? '',
      is_public: (org as any).isPublic ?? false,
      created_at: org.createdAt,
      updated_at: org.createdAt,
      person_count: '0',
    };
  })
  .get('/:id', async (context) => {
    const session = await getSession(context);
    const treeId = (context.params as { id: string }).id;

    let org: any = null;
    if (session?.user?.id) {
      org = await auth.api.getFullOrganization({
        query: { organizationId: treeId },
        headers: context.request.headers,
      });
    }

    if (!org) {
      const { rows } = await pool.query(
        `SELECT id, name, slug, "createdAt", description, "coverImage", "isPublic" FROM organization WHERE id = $1`,
        [treeId],
      );
      if (rows.length === 0) {
        context.set.status = 404;
        return { error: 'Tree not found' };
      }
      org = rows[0];
    }

    if (!(org as any).isPublic) {
      if (!session?.user?.id) {
        context.set.status = 401;
        return { error: 'Unauthorized' };
      }
      const isMember = (org as any).members?.some((m: any) => m.userId === session.user!.id);
      if (!isMember) {
        context.set.status = 403;
        return { error: 'Forbidden' };
      }
    }

    const { rows: personRows } = await pool.query(
      `select count(*) as person_count from "persons" where "organization_id" = $1`,
      [treeId],
    );

    const member = session?.user?.id
      ? (org as any).members?.find((m: any) => m.userId === session.user!.id)
      : null;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: (org as any).description ?? '',
      cover_image: (org as any).coverImage ?? '',
      is_public: (org as any).isPublic ?? false,
      created_at: org.createdAt,
      updated_at: org.createdAt,
      person_count: personRows[0]?.person_count ?? '0',
      user_role: member?.role ?? 'viewer',
    };
  })
  .put('/:id', async (context) => {
    const session = await getSession(context);
    if (!session?.user?.id) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const treeId = (context.params as { id: string }).id;
    const body = context.body as {
      name?: string;
      description?: string;
      cover_image?: string;
      is_public?: boolean;
    };

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.cover_image !== undefined) updateData.coverImage = body.cover_image;
    if (body.is_public !== undefined) updateData.isPublic = body.is_public;

    const org = await auth.api.updateOrganization({
      body: {
        organizationId: treeId,
        data: updateData,
      },
      headers: context.request.headers,
    });

    if (!org) {
      context.set.status = 404;
      return { error: 'Tree not found' };
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: (org as any).description ?? '',
      cover_image: (org as any).coverImage ?? '',
      is_public: (org as any).isPublic ?? false,
      created_at: org.createdAt,
      updated_at: org.createdAt,
    };
  })
  .delete('/:id', async (context) => {
    const session = await getSession(context);
    if (!session?.user?.id) {
      context.set.status = 401;
      return { error: 'Unauthorized' };
    }

    const treeId = (context.params as { id: string }).id;

    await auth.api.deleteOrganization({
      body: { organizationId: treeId },
      headers: context.request.headers,
    });

    return { success: true };
  });
