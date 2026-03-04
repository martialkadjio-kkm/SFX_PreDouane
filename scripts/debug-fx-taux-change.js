const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function debugFxTauxChange() {
    try {
        const dossierId = 1;
        const dateDeclaration = new Date('2025-12-08');
        
        console.log('Debug de fx_TauxChangeDossier...\n');
        
        // 1. DEVISES_DOSSIER
        console.log('1. Devises utilisées dans le dossier:');
        const devisesDossier = await prisma.$queryRaw`
            SELECT DISTINCT [Devise] as ID_Devise
            FROM [dbo].[TColisageDossiers]
            WHERE [Dossier]=${dossierId}
        `;
        devisesDossier.forEach(d => console.log(`   - Devise ${d.ID_Devise}`));
        
        // 2. ENTITE_DOSSIER
        console.log('\n2. Entité et devise locale du dossier:');
        const entiteDossier = await prisma.$queryRaw`
            SELECT C.[ID Entite], D.[Devise Locale] as ID_Devise0
            FROM dbo.TDossiers A
            INNER JOIN dbo.TBranches B On A.[Branche]=B.[ID Branche]
            INNER JOIN dbo.TEntites C ON B.[Entite]=C.[ID Entite]
            INNER JOIN dbo.TPays D ON C.[Pays]=D.[ID Pays]
            WHERE A.[ID Dossier]=${dossierId}
        `;
        console.log(`   Entité: ${entiteDossier[0].ID_Entite}`);
        console.log(`   Devise locale: ${entiteDossier[0].ID_Devise0}`);
        
        // 3. TAUXCHANGE_DOSSIER
        console.log('\n3. Taux de change pour cette date et entité:');
        const tauxChangeDossier = await prisma.$queryRaw`
            SELECT B.[ID Convertion], A.[Devise] as ID_Devise, A.[Taux Change]
            FROM dbo.TTauxChange A 
            INNER JOIN dbo.TConvertions B ON A.[Convertion]=B.[ID Convertion]
            WHERE (B.[Date Convertion]=${dateDeclaration}) AND (B.[Entite]=${entiteDossier[0].ID_Entite})
        `;
        console.log(`   Total: ${tauxChangeDossier.length} taux`);
        tauxChangeDossier.forEach(t => {
            console.log(`   - Devise ${t.ID_Devise}: ${t.Taux_Change} (Conversion ${t.ID_Convertion})`);
        });
        
        // 4. TAUX_DEVISE_LOCALE
        console.log('\n4. Taux de la devise locale:');
        const tauxDeviseLocale = tauxChangeDossier.filter(t => t.ID_Devise === entiteDossier[0].ID_Devise0);
        if (tauxDeviseLocale.length === 0) {
            console.log(`   ❌ AUCUN TAUX TROUVÉ POUR LA DEVISE LOCALE ${entiteDossier[0].ID_Devise0}!`);
            console.log('   C\'est pourquoi la fonction retourne 0 lignes!');
            console.log(`   \n💡 Ajoutez un taux pour la devise ${entiteDossier[0].ID_Devise0} dans la conversion.`);
        } else {
            console.log(`   ✅ Taux devise locale: ${tauxDeviseLocale[0].Taux_Change}`);
        }
        
        // 5. Résultat final
        console.log('\n5. Résultat de fx_TauxChangeDossier:');
        const result = await prisma.$queryRaw`
            SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId}, ${dateDeclaration})
        `;
        console.log(`   ${result.length} ligne(s) retournée(s)`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugFxTauxChange();
