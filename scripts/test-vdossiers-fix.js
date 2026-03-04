const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVDossiers() {
  try {
    console.log('🔍 Test VDossiers structure...');
    
    // Test 1: Vérifier la structure
    const result = await prisma.$queryRawUnsafe(`SELECT TOP 1 * FROM VDossiers`);
    console.log('✅ Colonnes disponibles:', Object.keys(result[0]));
    
    // Test 2: Test getDossiersByClientId avec les nouveaux noms de colonnes
    console.log('\n🔍 Test getDossiersByClientId...');
    const dossiers = await prisma.$queryRawUnsafe(`
      SELECT TOP 3
        [ID Dossier] as ID_Dossier,
        [No Dossier] as No_Dossier,
        [ID Client] as ID_Client,
        [Nom Client] as Nom_Client,
        [Statut Dossier] as Statut_Dossier,
        [Libelle Statut Dossier] as Libelle_Statut_Dossier
      FROM VDossiers
      WHERE [ID Client] = 1
    `);
    console.log('✅ Dossiers trouvés:', dossiers.length);
    if (dossiers.length > 0) {
      console.log('📋 Premier dossier:', dossiers[0]);
    }
    
    // Test 3: Vérifier les filtres
    console.log('\n🔍 Test filtres...');
    const dossiersFiltered = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM VDossiers
      WHERE [Statut Dossier] = 0
    `);
    console.log('✅ Dossiers avec statut 0:', dossiersFiltered[0].total);
    
    // Test 4: Test recherche
    console.log('\n🔍 Test recherche...');
    const dossiersSearch = await prisma.$queryRawUnsafe(`
      SELECT TOP 2 [No Dossier], [Nom Client]
      FROM VDossiers
      WHERE [No Dossier] LIKE '%D%'
    `);
    console.log('✅ Dossiers avec "D" dans le numéro:', dossiersSearch.length);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVDossiers();