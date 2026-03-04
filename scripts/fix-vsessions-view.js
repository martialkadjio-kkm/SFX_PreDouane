const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixVSessionsView() {
    try {
        console.log('Correction de la vue VSessions...\n');
        
        // Supprimer et recréer la vue en utilisant EXEC
        await prisma.$executeRawUnsafe(`
            EXEC('
                IF OBJECT_ID(''dbo.VSessions'', ''V'') IS NOT NULL
                    DROP VIEW dbo.VSessions;
                    
                CREATE VIEW [dbo].[VSessions]
                AS
                SELECT A.[ID Session] AS [ID_Session]
                      ,B.[ID Utilisateur] AS [ID_Utilisateur]
                      ,B.[Nom Utilisateur] AS [Nom_Utilisateur]
                      ,A.[Debut Session] AS [Debut_Session]
                      ,A.[Fin Session] AS [Fin_Session]
                FROM dbo.TSessions A 
                INNER JOIN dbo.TUtilisateurs B ON A.[Utilisateur]=B.[ID Utilisateur]
            ')
        `);
        console.log('✅ Vue VSessions corrigée avec la bonne jointure\n');
        
        // Vérifier le résultat
        const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM VSessions`;
        console.log(`Nombre de sessions: ${count[0].count}`);
        
        const sessions = await prisma.$queryRaw`SELECT TOP 5 * FROM VSessions`;
        console.log('\nPremières sessions:');
        sessions.forEach(s => {
            console.log(`  - Session ${s.ID_Session}: Utilisateur ${s.ID_Utilisateur} (${s.Nom_Utilisateur})`);
        });
        
        // Vérifier que les doublons sont corrigés
        console.log('\nVérification des colisages:');
        const colisageCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM VColisageDossiers WHERE ID_Dossier = 1
        `;
        console.log(`Vue VColisageDossiers pour dossier 1: ${colisageCount[0].count} ligne(s)`);
        
        const tableCount = await prisma.tColisageDossiers.count({
            where: { dossier: 1 }
        });
        console.log(`Table TColisageDossiers pour dossier 1: ${tableCount} ligne(s)`);
        
        if (colisageCount[0].count === tableCount) {
            console.log('\n✅ Les doublons sont corrigés!');
        } else {
            console.log('\n⚠️  Il reste encore des doublons');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixVSessionsView();
