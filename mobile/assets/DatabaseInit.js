// DatabaseInit.js
export const initializeDatabase = async (db) => {
  try {
    // Ensure foreign keys are ON at the very beginning if not already set,
    // or when creating tables that need them.
    await db.execAsync('PRAGMA foreign_keys = ON;');

       // 1. Initialize 'users' table (with robust logging)   
    const usersExists = await db.getFirstAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='users';`
    );    

    if (!usersExists) {
      try {
        await db.execAsync(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL, -- 'user' or 'admin'
            firstLoginDone INTEGER DEFAULT 0 -- 0 for false, 1 for true
          );
        `);     
       
       //console.log("Created 'users' table.");

      } catch (e) {
        console.error("Error creating users table:", e);
      }
    } else {
      console.log("'users' table already exists.");
    }

    const initialUsers = [
      { username: 'user', password: '1234', role: 'user', firstLoginDone: 0 },
      { username: 'admin', password: '123456', role: 'admin', firstLoginDone: 0 }
    ];

    for (const user of initialUsers) {
      try {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO users (username, password, role, firstLoginDone) VALUES (?, ?, ?, ?);`,
          [user.username, user.password, user.role, user.firstLoginDone]
        );
        if (result.changes > 0) {
          console.log(`Initial user '${user.username}' inserted.`);
        } else {
          console.log(`User '${user.username}' already exists, skipped insertion.`);
        }
      } catch (insertError) {
        console.error(`Error attempting to insert user '${user.username}':`, insertError);
      }
    }

    // 2. Initialize 'ingredientItemList'
    const ingredientItemListExists = await db.getFirstAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='ingredientItemList';`
    );

    // if (!ingredientItemListExists) {
    //   await db.execAsync(`
    //     CREATE TABLE ingredientItemList (
    //       itemId    INTEGER PRIMARY KEY AUTOINCREMENT,
    //       name      TEXT    NOT NULL,
    //       quantity  NUMERIC NOT NULL,
    //       unit      TEXT    NOT NULL,
    //       category  TEXT    NOT NULL
    //     );
    //   `);
    //   console.log("Table 'ingredientItemList' created.");
    // }

    if (!ingredientItemListExists) {
      await db.execAsync(`
       CREATE TABLE ingredientItemList (
          itemId    INTEGER PRIMARY KEY AUTOINCREMENT,
          name      TEXT    NOT NULL,
          quantity  NUMERIC NOT NULL,
          unit      TEXT    NOT NULL,
          category  TEXT    NOT NULL,
          sortOrder INTEGER DEFAULT 0
        );
      `);
      console.log("Table 'ingredientItemList' created.");
    }


    // 3. Initialize 'customerinfo'
    const customerInfoExists = await db.getFirstAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='customerinfo';`
    );
    if (!customerInfoExists) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customerinfo (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fullName TEXT,
          mobile TEXT,
          address TEXT,
          functionType TEXT,
          functionDate TEXT,
          venueAddress TEXT,
          totalAmount TEXT,
          advanceAmount TEXT,
          balanceAmount TEXT
        );
      `);
      console.log("Table 'customerinfo' created.");
    }

    // 4. Initialize 'customeritems'
    const customerItemsExists = await db.getFirstAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='customeritems';`
    );
    if (!customerItemsExists) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customeritems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          name TEXT,
          quantity INTEGER,
          category TEXT,
          unit TEXT,
          FOREIGN KEY (customerId) REFERENCES customerinfo(id) ON DELETE CASCADE
        );
      `);
      console.log("Table 'customeritems' created.");
    }

    // 5. Initialize 'customermealmenu'
    const customerMealMenuExists = await db.getFirstAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='customermealmenu';`
    );
    if (!customerMealMenuExists) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS customermealmenu (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER NOT NULL,
          category TEXT NOT NULL,
          itemName TEXT NOT NULL,
          FOREIGN KEY (customerId) REFERENCES customerinfo(id) ON DELETE CASCADE
        );
      `);
      console.log("Table 'customermealmenu' created.");
    }

    console.log('Database initialization complete.');

  } catch (error) {
    console.error('CRITICAL ERROR during database initialization:', error);
    throw error;
  } finally {
    console.log('--- initializeDatabase function finished ---');
  }
};

// NEW FUNCTION: To get all user-defined table names
export const getTableNames = async (db) => {
  try {
    const result = await db.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'expo_%';
    `);
    return result.map(row => row.name);
  } catch (error) {
    console.error('Error getting table names:', error);
    throw error;
  }
};

// NEW FUNCTION: To clear only selected tables (by deleting all rows)
export const clearSelectedTables = async (db, tablesToClear) => {
  try {
    console.log("Clearing selected database tables:", tablesToClear);
    await db.execAsync('PRAGMA foreign_keys = OFF;'); // Temporarily disable foreign key checks

    for (const tableName of tablesToClear) {
      await db.execAsync(`DELETE FROM ${tableName};`); // Clears all data from the table
      console.log(`Cleared data from table: ${tableName}`);
    }

    await db.execAsync('PRAGMA foreign_keys = ON;'); // Re-enable foreign key checks
    console.log("Selected database tables cleared successfully.");
  } catch (error) {
    console.error('Error clearing selected tables:', error);
    throw error;
  }
};

// Existing function for full database reset (if still needed)
export const clearAndRecreateTables = async (db) => {
  try {
    console.log("Clearing and recreating all database tables...");
    await db.execAsync('PRAGMA foreign_keys = OFF;'); // Temporarily disable foreign key checks

    // Get a list of all tables, excluding internal SQLite and Expo tables
    const tables = await db.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'expo_%';
    `);

    // Drop each table
    for (const table of tables) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table.name};`);
      console.log(`Dropped table: ${table.name}`);
    }

    // Reinitialize the database (recreate all tables)
    await db.execAsync('PRAGMA foreign_keys = ON;'); // Re-enable foreign key checks before re-initialization
    await initializeDatabase(db); // Call the main initialization function
    console.log("Database tables cleared and recreated successfully.");
  } catch (error) {
    console.error('Error clearing and recreating tables:', error);
    throw error;
  }
};