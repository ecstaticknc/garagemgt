import { Slot } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase } from '../assets/DatabaseInit';
import { useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { AuthProvider } from './(drawer)/AuthContext';

const loadDatabase = async () => {
  const dbName = 'samarthcatersdatabase.db';
  const dbAsset = require('../assets/samarthcatersdatabase.db');
  const dbUri = Asset.fromModule(dbAsset).uri;
  const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
  if (!fileInfo.exists) {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, {
      intermediates: true,
    });
    await FileSystem.downloadAsync(dbUri, dbFilePath);
  }
};

function DatabaseInitializer({ children }) {
  const db = useSQLiteContext();

  useEffect(() => {
    const init = async () => {
      try {
        await loadDatabase();
        await initializeDatabase(db);
        console.log('DB initialized successfully');
      } catch (err) {
        console.error('DB initialization error:', err);
      }
    };
    init();
  }, [db]);

  return children;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="samarthcatersdatabase.db">
      <AuthProvider>
      <DatabaseInitializer>
        <Slot />
      </DatabaseInitializer>
      </AuthProvider>
    </SQLiteProvider>
  );
}
