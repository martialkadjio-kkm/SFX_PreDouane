const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function create100HSCodes() {
    try {
        console.log('=== CRÉATION DE 100 HS CODES DE TEST ===\n');
        
        const hsCodesData = [
            { code: '01011000', description: 'Chevaux reproducteurs de race pure' },
            { code: '01012000', description: 'Chevaux vivants, autres que reproducteurs de race pure' },
            { code: '01013000', description: 'Ânes vivants' },
            { code: '01014000', description: 'Mulets et bardots vivants' },
            { code: '02011000', description: 'Carcasses et demi-carcasses de bovins, fraîches ou réfrigérées' },
            { code: '02012000', description: 'Autres morceaux non désossés de bovins, frais ou réfrigérés' },
            { code: '02013000', description: 'Viandes désossées de bovins, fraîches ou réfrigérées' },
            { code: '03011100', description: 'Poissons ornementaux d\'eau douce, vivants' },
            { code: '03011900', description: 'Autres poissons ornementaux vivants' },
            { code: '03021100', description: 'Truites fraîches ou réfrigérées' },
            { code: '04011000', description: 'Lait et crème de lait, non concentrés, teneur en matières grasses <= 1%' },
            { code: '04012000', description: 'Lait et crème de lait, non concentrés, teneur en matières grasses > 1% mais <= 6%' },
            { code: '04013000', description: 'Lait et crème de lait, non concentrés, teneur en matières grasses > 6%' },
            { code: '05011000', description: 'Cheveux bruts, même lavés ou dégraissés' },
            { code: '05021000', description: 'Soies de porc ou de sanglier' },
            { code: '06011000', description: 'Bulbes, oignons, tubercules, racines tubéreuses, griffes et rhizomes, en repos végétatif' },
            { code: '06012000', description: 'Bulbes, oignons, tubercules, racines tubéreuses, griffes et rhizomes, en végétation ou en fleur' },
            { code: '07011000', description: 'Pommes de terre de semence' },
            { code: '07019000', description: 'Autres pommes de terre, fraîches ou réfrigérées' },
            { code: '07020000', description: 'Tomates, fraîches ou réfrigérées' },
            { code: '08011100', description: 'Noix de coco desséchées' },
            { code: '08011200', description: 'Noix de coco avec leur coque interne (endocarpe)' },
            { code: '08011900', description: 'Autres noix de coco' },
            { code: '09011100', description: 'Café non torréfié, non décaféiné' },
            { code: '09011200', description: 'Café non torréfié, décaféiné' },
            { code: '10011000', description: 'Froment (blé) dur' },
            { code: '10019000', description: 'Froment (blé) et méteil, autres' },
            { code: '11010000', description: 'Farines de froment (blé) ou de méteil' },
            { code: '12011000', description: 'Fèves de soja, même concassées, pour ensemencement' },
            { code: '12019000', description: 'Autres fèves de soja, même concassées' },
            { code: '13012000', description: 'Gomme arabique' },
            { code: '13019000', description: 'Autres gommes, résines, gommes-résines et oléo-résines naturelles' },
            { code: '14011000', description: 'Bambous' },
            { code: '14012000', description: 'Rotins' },
            { code: '15071000', description: 'Huile de soja, brute, même dégommée' },
            { code: '15079000', description: 'Huile de soja et ses fractions, autres' },
            { code: '16010000', description: 'Saucisses, saucissons et produits similaires, de viande, d\'abats ou de sang' },
            { code: '17011100', description: 'Sucre de canne, brut, sans addition d\'aromatisants ou de colorants' },
            { code: '17011200', description: 'Sucre de betterave, brut, sans addition d\'aromatisants ou de colorants' },
            { code: '18010000', description: 'Cacao en fèves et brisures de fèves, bruts ou torréfiés' },
            { code: '19011000', description: 'Préparations pour l\'alimentation des enfants, conditionnées pour la vente au détail' },
            { code: '20011000', description: 'Concombres et cornichons, préparés ou conservés au vinaigre ou à l\'acide acétique' },
            { code: '21011100', description: 'Extraits, essences et concentrés de café' },
            { code: '22011000', description: 'Eaux minérales et eaux gazéifiées' },
            { code: '23011000', description: 'Farines, poudres et agglomérés sous forme de pellets, de viande ou d\'abats' },
            { code: '24011000', description: 'Tabacs non écôtés' },
            { code: '25010000', description: 'Sel (y compris le sel de table et le sel dénaturé) et chlorure de sodium pur' },
            { code: '26011100', description: 'Minerais de fer non agglomérés' },
            { code: '27011100', description: 'Houilles anthraciteuses' },
            { code: '28011000', description: 'Chlore' },
            { code: '29011000', description: 'Hydrocarbures acycliques saturés' },
            { code: '30021000', description: 'Antisérums et autres fractions du sang' },
            { code: '31010000', description: 'Engrais d\'origine animale ou végétale' },
            { code: '32011000', description: 'Extraits tannants d\'écorces' },
            { code: '33011100', description: 'Huiles essentielles d\'agrumes' },
            { code: '34011100', description: 'Savons et produits organiques tensio-actifs à usage de savon, en barres' },
            { code: '35011000', description: 'Caséines' },
            { code: '36010000', description: 'Poudres propulsives' },
            { code: '37011000', description: 'Plaques et films photographiques sensibilisés, non impressionnés, pour rayons X' },
            { code: '38011000', description: 'Graphite artificiel' },
            { code: '39011000', description: 'Polyéthylène d\'une densité spécifique < 0,94, sous formes primaires' },
            { code: '40011000', description: 'Latex de caoutchouc naturel, même prévulcanisé' },
            { code: '41012000', description: 'Cuirs et peaux bruts de bovins ou d\'équidés, frais ou salés' },
            { code: '42010000', description: 'Articles de sellerie ou de bourrellerie pour tous animaux' },
            { code: '43011000', description: 'Pelleteries brutes de vison, entières' },
            { code: '44011000', description: 'Bois de chauffage en rondins, bûches, ramilles, fagots ou sous formes similaires' },
            { code: '45011000', description: 'Liège naturel brut ou simplement préparé' },
            { code: '46012000', description: 'Nattes, paillassons et claies, en matières végétales' },
            { code: '47010000', description: 'Pâtes mécaniques de bois' },
            { code: '48011000', description: 'Papier journal, en rouleaux ou en feuilles' },
            { code: '49011000', description: 'Livres, brochures et imprimés similaires, en feuillets isolés' },
            { code: '50010000', description: 'Cocons de vers à soie propres au dévidage' },
            { code: '51011100', description: 'Laines en suint, non cardées ni peignées' },
            { code: '52010000', description: 'Coton, non cardé ni peigné' },
            { code: '53011000', description: 'Lin brut ou roui' },
            { code: '54011000', description: 'Fils à coudre de filaments synthétiques ou artificiels' },
            { code: '55011000', description: 'Fibres synthétiques discontinues de nylon ou d\'autres polyamides, non cardées' },
            { code: '56011000', description: 'Ouates de matières textiles et articles en ces ouates' },
            { code: '57011000', description: 'Tapis noués à la main ou confectionnés à l\'aiguille' },
            { code: '58011000', description: 'Velours et peluches tissés, autres que les articles du n° 58.02 ou 58.06' },
            { code: '59011000', description: 'Tissus enduits de colle ou de matières amylacées' },
            { code: '60011000', description: 'Velours, peluches, tissus bouclés et tissus de chenille, en bonneterie' },
            { code: '61011000', description: 'Manteaux, imperméables, cabans, capes et articles similaires, pour hommes ou garçonnets' },
            { code: '62011000', description: 'Manteaux, imperméables, cabans, capes et articles similaires, pour hommes ou garçonnets' },
            { code: '63011000', description: 'Couvertures et plaids, autres qu\'électriques' },
            { code: '64011000', description: 'Chaussures à semelles extérieures en caoutchouc ou en matière plastique' },
            { code: '65010000', description: 'Cloches non dressées ni tournurées et plateaux découpés en feutre' },
            { code: '66011000', description: 'Parapluies de jardin et parasols similaires' },
            { code: '67010000', description: 'Peaux et autres parties d\'oiseaux revêtues de leurs plumes ou de leur duvet' },
            { code: '68010000', description: 'Pierres de taille ou de construction travaillées et ouvrages en ces pierres' },
            { code: '69010000', description: 'Briques, dalles, carreaux et autres pièces céramiques de construction' },
            { code: '70010000', description: 'Calcin et autres déchets et débris de verre' },
            { code: '71011000', description: 'Perles fines naturelles' },
            { code: '72011000', description: 'Fonte brute non alliée contenant en poids <= 0,5 % de phosphore' },
            { code: '73011000', description: 'Palplanches en fer ou en acier' },
            { code: '74011000', description: 'Mattes de cuivre' },
            { code: '75011000', description: 'Mattes de nickel' },
            { code: '76011000', description: 'Aluminium sous forme brute' },
            { code: '78011000', description: 'Plomb affiné' },
            { code: '79011000', description: 'Zinc sous forme brute' },
            { code: '80011000', description: 'Étain sous forme brute' },
            { code: '81011000', description: 'Tungstène (wolfram) sous forme brute' },
            { code: '82011000', description: 'Bêches, pelles, pioches, pics, houes, binettes, fourches et râteaux' },
            { code: '83011000', description: 'Cadenas' },
            { code: '84011000', description: 'Réacteurs nucléaires' },
            { code: '85011000', description: 'Moteurs d\'une puissance n\'excédant pas 37,5 W' },
            { code: '86011000', description: 'Locomotives et locotracteurs à vapeur' },
            { code: '87011000', description: 'Tracteurs (autres que les chariots-tracteurs du n° 87.09)' },
            { code: '88011000', description: 'Planeurs et ailes volantes' },
            { code: '89011000', description: 'Paquebots, bateaux de croisières et bateaux similaires' },
            { code: '90011000', description: 'Fibres optiques, faisceaux et câbles de fibres optiques' },
            { code: '91011100', description: 'Montres-bracelets à affichage mécanique seulement' },
            { code: '92011000', description: 'Pianos droits' },
            { code: '93011000', description: 'Pièces d\'artillerie (canons, obusiers, mortiers)' },
            { code: '94011000', description: 'Sièges (autres que ceux du n° 94.02), même transformables en lits' },
            { code: '95011000', description: 'Jouets représentant des animaux ou des créatures non humaines' },
            { code: '96011000', description: 'Ivoire travaillé et ouvrages en ivoire' }
        ];

        console.log(`Création de ${hsCodesData.length} HS Codes...`);
        
        let created = 0;
        let skipped = 0;
        
        for (const item of hsCodesData) {
            try {
                // Vérifier si le HS Code existe déjà
                const existing = await prisma.tHSCodes.findFirst({
                    where: { hsCode: item.code }
                });
                
                if (existing) {
                    console.log(`⏭️  HS Code ${item.code} existe déjà, ignoré`);
                    skipped++;
                    continue;
                }
                
                // Créer le HS Code
                await prisma.tHSCodes.create({
                    data: {
                        hsCode: item.code,
                        libelleHSCode: item.description,
                        uploadKey: `SEED_${item.code}`,
                        session: 1,
                        dateCreation: new Date()
                    }
                });
                
                created++;
                
                if (created % 10 === 0) {
                    console.log(`✅ ${created} HS Codes créés...`);
                }
                
            } catch (error) {
                console.error(`❌ Erreur pour ${item.code}:`, error.message);
            }
        }
        
        console.log(`\n🎉 TERMINÉ !`);
        console.log(`✅ ${created} HS Codes créés`);
        console.log(`⏭️  ${skipped} HS Codes ignorés (déjà existants)`);
        console.log(`📊 Total dans la base: ${created + skipped}`);
        
        // Vérifier le total
        const total = await prisma.tHSCodes.count();
        console.log(`🔍 Vérification: ${total} HS Codes dans la base de données`);
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

create100HSCodes();