// Test simple pour VDossiers sans Prisma
const sql = require('mssql');

async function testVDossiers() {
    try {
        // Configuration de connexion (ajustez selon votre configuration)
        const config = {
            server: 'localhost',
            database: 'SFX_PreDouane',
            options: {
                trustedConnection: true,
                enableArithAbort: true,
            }
        };

        console.log('🔍 Connexion à la base de données...');
        await sql.connect(config);

        // Test 1: Vérifier la structure
        console.log('\n📋 Structure de VDossiers:');
        const structure = await sql.query(`
            SELECT TOP 5 COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'VDossiers'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Colonnes:', structure.recordset.map(r => r.COLUMN_NAME));

        // Test 2: Vérifier les colonnes de date
        console.log('\n📅 Colonnes contenant "Date":');
        const dateColumns = await sql.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'VDossiers'
                AND COLUMN_NAME LIKE '%Date%'
        `);
        console.log('Colonnes Date:', dateColumns.recordset.map(r => r.COLUMN_NAME));

        // Test 3: Premier enregistrement
        console.log('\n📊 Premier enregistrement:');
        const firstRecord = await sql.query(`SELECT TOP 1 * FROM VDossiers`);
        if (firstRecord.recordset.length > 0) {
            console.log('Colonnes disponibles:', Object.keys(firstRecord.recordset[0]));
        }

        await sql.close();
        console.log('\n✅ Test terminé');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testVDossiers();