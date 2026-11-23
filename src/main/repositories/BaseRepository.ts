
import { DatabaseConnection } from '../database/DatabaseConnection';

export type DatabaseRecord = {
  id: number;
};

export abstract class BaseRepository<T extends DatabaseRecord> {
  protected readonly database: DatabaseConnection;

  protected constructor(
    private readonly tableName: string,
    private readonly allowedColumns: readonly string[]
  ) {
    this.database = DatabaseConnection.getInstance();

    this.validateIdentifier(tableName);

    for (const column of allowedColumns) {
      this.validateIdentifier(column);
    }
  }

  /**
   * Valida identificadores SQL.
   */
  private validateIdentifier(identifier: string): void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new Error(`Identificador SQL inválido: ${identifier}`);
    }
  }

  /**
   * Verifica se as colunas informadas são permitidas.
   */
  private validateColumns(data: Record<string, unknown>): string[] {
    const columns = Object.keys(data);

    if (columns.length === 0) {
      throw new Error('Nenhum dado informado.');
    }

    for (const column of columns) {
      this.validateIdentifier(column);

      if (!this.allowedColumns.includes(column)) {
        throw new Error(`Coluna não permitida: ${column}`);
      }
    }

    return columns;
  }

  /**
   * Busca todos os registros.
   */
  public findAll(): T[] {
    return this.database.query<T>(
      `SELECT * FROM ${this.tableName}`
    );
  }

  /**
   * Busca um registro pelo ID.
   */
  public findById(id: number): T | null {
    const results = this.database.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return results[0] ?? null;
  }

  /**
   * Insere um novo registro.
   */
  public create(data: Record<string, unknown>): number {
    const columns = this.validateColumns(data);

    const placeholders = columns.map(() => '?').join(', ');

    const values = columns.map(column => data[column]);

    const sql = `
      INSERT INTO ${this.tableName}
      (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    this.database.execute(sql, values);

    return this.database.getLastInsertId();
  }

  /**
   * Atualiza um registro existente.
   */
  public update(
    id: number,
    data: Record<string, unknown>
  ): boolean {
    const columns = this.validateColumns(data);

    const assignments = columns
      .map(column => `${column} = ?`)
      .join(', ');

    const values = columns.map(column => data[column]);

    this.database.execute(
      `UPDATE ${this.tableName} SET ${assignments} WHERE id = ?`,
      [...values, id]
    );

    return this.findById(id) !== null;
  }

  /**
   * Exclui um registro pelo ID.
   */
  public delete(id: number): boolean {
    const existing = this.findById(id);

    if (!existing) {
      return false;
    }

    this.database.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return true;
  }
}
