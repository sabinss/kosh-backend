import {
    eq,
    type InferInsertModel,
    type InferSelectModel,
    type SQL,
} from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Database } from '../../db';

// Row returned by SELECT / RETURNING for a table, e.g. User for the users table.
export type RowOf<TTable extends PgTable> = InferSelectModel<TTable>;

// Values accepted by INSERT for a table, e.g. NewUser for the users table.
export type InsertOf<TTable extends PgTable> = InferInsertModel<TTable>;

/**
 * Generic data-access layer for one table. Every repository extends this and
 * gets the common CRUD methods for free. Table-specific queries live in the
 * subclass (see modules/users/user.repository.ts).
 *
 * Contract: the table must have an `id` primary key column.
 *
 * Note: Drizzle's query types cannot be fully inferred through a generic table
 * parameter, so results are cast to RowOf<TTable> at each query. Concrete
 * repositories still get fully typed results.
 */
export abstract class BaseRepository<
    TTable extends PgTable & { id: AnyPgColumn },
> {
    // `db` is injected so tests can pass a different database or transaction.
    constructor(
        protected readonly db: Database,
        protected readonly table: TTable,
    ) {}

    // ---- Reads -------------------------------------------------------------

    async findById(id: string): Promise<RowOf<TTable> | undefined> {
        const rows = (await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.id, id))
            .limit(1)) as RowOf<TTable>[];
        return rows[0];
    }

    // First row matching a condition, e.g. findOne(eq(users.email, email)).
    async findOne(where: SQL): Promise<RowOf<TTable> | undefined> {
        const rows = (await this.db
            .select()
            .from(this.table)
            .where(where)
            .limit(1)) as RowOf<TTable>[];
        return rows[0];
    }

    // All rows matching a condition. No condition returns every row, so use
    // pagination (limit/offset) once a table grows.
    async findMany(where?: SQL): Promise<RowOf<TTable>[]> {
        const rows = where
            ? await this.db.select().from(this.table).where(where)
            : await this.db.select().from(this.table);
        return rows;
    }

    // ---- Writes ------------------------------------------------------------

    async create(data: InsertOf<TTable>): Promise<RowOf<TTable>> {
        const rows = (await this.db
            .insert(this.table)
            .values(data as never)
            .returning()) as RowOf<TTable>[];
        const row = rows[0];
        if (!row) {
            throw new Error('Insert returned no row');
        }
        return row;
    }

    // Returns the updated row, or undefined if no row has that id.
    async updateById(
        id: string,
        data: Partial<InsertOf<TTable>>,
    ): Promise<RowOf<TTable> | undefined> {
        const rows = (await this.db
            .update(this.table)
            .set(data)
            .where(eq(this.table.id, id))
            .returning()) as RowOf<TTable>[];
        return rows[0];
    }

    // Returns true if a row was deleted.
    async deleteById(id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(this.table)
            .where(eq(this.table.id, id))
            .returning({ id: this.table.id });
        return deleted.length > 0;
    }
}
