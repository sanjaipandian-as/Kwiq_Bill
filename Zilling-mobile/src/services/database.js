import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Opens the physical database file on the mobile device
export const db = SQLite.openDatabaseSync('zilling.db');

export const initializeDB = () => {
  try {
    // 1. Initial basic setup
    db.execSync('PRAGMA journal_mode = WAL;');

    // 2. Robust Migration for Customers (Existing Stage-based logic)
    console.log("[DB] STAGE 1: Checking customers schema...");
    try {
      const tableInfo = db.getAllSync(`PRAGMA table_info(customers)`);
      const columns = tableInfo.map(c => c.name);

      if (columns.length === 0) {
        console.log("[DB] Customers table missing. Creating...");
        throw new Error("Table missing");
      }

      if (columns.includes('firstName')) {
        console.log("[DB] Old customer schema detected. Forcing recreation.");
        throw new Error("Old schema");
      }
      console.log("[DB] Customer schema OK.");
    } catch (e) {
      console.log("[DB] Recreating customers table...");
      db.execSync(`DROP TABLE IF EXISTS customers_old;`);
      try { db.execSync(`ALTER TABLE customers RENAME TO customers_old;`); } catch (err) { }

      db.execSync(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          type TEXT,
          gstin TEXT,
          address TEXT,
          source TEXT,
          tags TEXT,
          loyaltyPoints INTEGER DEFAULT 0,
          notes TEXT,
          created_at TEXT,
          updated_at TEXT
        )
      `);
    }

    // 3. Robust Migration for Products (FIXES THE NOT NULL SKU ERROR AND ADDS VARIANT)
    console.log("[DB] STAGE 2: Checking products schema...");
    try {
      const prodInfo = db.getAllSync(`PRAGMA table_info(products)`);
      const prodCols = prodInfo.map(c => c.name);

      // Check if essential new columns are missing (tax_rate OR the new variant column OR min_stock)
      const hasTaxRate = prodCols.includes('tax_rate');
      const hasVariant = prodCols.includes('variant');
      const hasMinStock = prodCols.includes('min_stock');

      if (prodCols.length > 0 && (!hasTaxRate || !hasVariant || !hasMinStock)) {
        console.log("[DB] Products schema update needed...");
        db.execSync(`DROP TABLE IF EXISTS products_old_v3;`); // Safety clear
        try { db.execSync(`ALTER TABLE products RENAME TO products_old_v3;`); } catch (err) { }

        db.execSync(`
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    sku TEXT NOT NULL,
                    category TEXT,
                    price REAL DEFAULT 0,
                    stock INTEGER DEFAULT 0,
                    min_stock INTEGER DEFAULT 0, -- New column
                    unit TEXT DEFAULT 'pc',
                    tax_rate REAL DEFAULT 0,
                    variants JSON DEFAULT '[]',
                    variant TEXT,
                    created_at TEXT,
                    updated_at TEXT,
                    UNIQUE(sku)
                )
            `);

        // Migrate existing data
        const selectCols = [];
        const insertCols = [];

        const colMap = {
          id: 'id', name: 'name', sku: 'sku', category: 'category',
          price: 'price', stock: 'stock', unit: 'unit',
          tax_rate: 'tax_rate', variants: 'variants',
          variant: 'variant', created_at: 'created_at', updated_at: 'updated_at'
        };

        prodCols.forEach(c => {
          if (colMap[c]) {
            selectCols.push(c);
            insertCols.push(c);
          }
        });

        db.execSync(`
                INSERT INTO products (${insertCols.join(', ')})
                SELECT ${selectCols.join(', ')} FROM products_old_v3;
            `);

        db.execSync(`DROP TABLE products_old_v3;`);
        console.log("[DB] Products migrated successfully to latest schema.");
      }
    } catch (e) {
      console.log("[DB] Migration Check Failed or Creating initial products table...", e);
    }

    // 4. Migration for Customers (Add Amount Paid)
    console.log("[DB] STAGE 3: Checking customers schema for amountPaid...");
    try {
      const custInfo = db.getAllSync(`PRAGMA table_info(customers)`);
      const custCols = custInfo.map(c => c.name);

      if (custCols.length > 0 && !custCols.includes('amountPaid')) {
        console.log("[DB] Adding amountPaid column to customers...");
        db.execSync(`ALTER TABLE customers ADD COLUMN amountPaid REAL DEFAULT 0;`);
        console.log("[DB] amountPaid column added.");
      }
    } catch (e) {
      console.log("[DB] Customer Amount Migration Failed:", e);
    }



    // 5. Migration for Customer Opt-ins (WhatsApp & SMS)
    console.log("[DB] STAGE 4: Checking customers schema for opt-ins...");
    try {
      const custInfo = db.getAllSync(`PRAGMA table_info(customers)`);
      const custCols = custInfo.map(c => c.name);

      if (custCols.length > 0 && !custCols.includes('whatsappOptIn')) {
        console.log("[DB] Adding opt-in columns to customers...");
        try { db.execSync(`ALTER TABLE customers ADD COLUMN whatsappOptIn INTEGER DEFAULT 0;`); } catch (e) { }
        try { db.execSync(`ALTER TABLE customers ADD COLUMN smsOptIn INTEGER DEFAULT 0;`); } catch (e) { }
        console.log("[DB] Opt-in columns added.");
      }
    } catch (e) {
      console.log("[DB] Customer Opt-in Migration Failed:", e);
    }

    // 6. Migration for Invoice Tax Type (IGST Support) and Missing Totals
    console.log("[DB] STAGE 5: Checking invoices schema for missing columns...");
    try {
      const invInfo = db.getAllSync(`PRAGMA table_info(invoices)`);
      const invCols = invInfo.map(c => c.name);

      const missingCols = [
        { name: 'taxType', type: 'TEXT DEFAULT \'intra\'' },
        { name: 'grossTotal', type: 'REAL DEFAULT 0' },
        { name: 'itemDiscount', type: 'REAL DEFAULT 0' },
        { name: 'additionalCharges', type: 'REAL DEFAULT 0' },
        { name: 'roundOff', type: 'REAL DEFAULT 0' },
        { name: 'amountReceived', type: 'REAL DEFAULT 0' },
        { name: 'internalNotes', type: 'TEXT' }
      ];

      if (invCols.length > 0) {
        missingCols.forEach(col => {
          if (!invCols.includes(col.name)) {
            console.log(`[DB] Adding ${col.name} column to invoices...`);
            try { db.execSync(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type};`); } catch (e) { }
          }
        });
        console.log("[DB] Invoice schema check/migration complete.");
      }
    } catch (e) {
      console.log("[DB] Invoice Migration Failed:", e);
    }

    // 4. Unified Table Creation (Safety net)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        type TEXT,
        gstin TEXT,
        address TEXT,
        source TEXT,
        tags TEXT,
        loyaltyPoints INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        category TEXT,
        price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        unit TEXT DEFAULT 'pc',
        tax_rate REAL DEFAULT 0,
        variants JSON DEFAULT '[]',
        variant TEXT,
        created_at TEXT,
        updated_at TEXT,
        UNIQUE(sku)
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        customer_name TEXT,
        date TEXT,
        type TEXT,
        items JSON,
        subtotal REAL,
        tax REAL,
        discount REAL,
        total REAL,
        status TEXT,
        payments JSON,
        grossTotal REAL DEFAULT 0,
        itemDiscount REAL DEFAULT 0,
        additionalCharges REAL DEFAULT 0,
        roundOff REAL DEFAULT 0,
        amountReceived REAL DEFAULT 0,
        internalNotes TEXT,
        taxType TEXT DEFAULT 'intra',
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        title TEXT,
        amount REAL,
        category TEXT,
        date TEXT,
        payment_method TEXT,
        tags JSON,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        data JSON,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS expense_adjustments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_id TEXT,
        delta REAL,
        reason TEXT,
        created_at TEXT,
        FOREIGN KEY(expense_id) REFERENCES expenses(id)
      );
    `);

    console.log("Local SQLite Database Initialized synchronously");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
};

// Run it immediately
initializeDB();

export const fetchAllTableData = async () => {
  try {
    const settingsStr = await AsyncStorage.getItem('app_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};

    return {
      customers: db.getAllSync('SELECT * FROM customers'),
      products: db.getAllSync('SELECT * FROM products'),
      invoices: db.getAllSync('SELECT * FROM invoices'),
      expenses: db.getAllSync('SELECT * FROM expenses'),
      settings: [settings],
    };
  } catch (error) {
    console.error("Error fetching table data:", error);
    return { customers: [], products: [], invoices: [], expenses: [], settings: [] };
  }
};

export const clearDatabase = async () => {
  try {
    console.log('[DB] Clearing all local data...');
    db.execSync('DELETE FROM customers');
    db.execSync('DELETE FROM products');
    db.execSync('DELETE FROM invoices');
    db.execSync('DELETE FROM expenses');
    db.execSync('DELETE FROM expense_adjustments');
    db.execSync('DELETE FROM settings');
    console.log('[DB] All tables cleared.');
    return true;
  } catch (error) {
    console.error('[DB] Failed to clear database:', error);
    return false;
  }
};