const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

// Mapping des pays avec leurs devises locales
const countriesWithCurrencies = [
    { code: 'CM', name: 'Cameroon', currency: 'XAF' },
    { code: 'FR', name: 'France', currency: 'EUR' },
    { code: 'US', name: 'U.S.A.', currency: 'USD' },
    { code: 'CN', name: 'China', currency: 'CNY' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
    { code: 'BR', name: 'Brazil', currency: 'BRL' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'IT', name: 'Italy', currency: 'EUR' },
    { code: 'ES', name: 'Spain', currency: 'EUR' },
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'KR', name: 'South Korea', currency: 'KRW' },
    { code: 'NL', name: 'Netherlands', currency: 'EUR' },
    { code: 'CH', name: 'Switzerland', currency: 'CHF' },
    { code: 'BE', name: 'Belgium', currency: 'EUR' },
    { code: 'SE', name: 'Sweden', currency: 'SEK' },
    { code: 'PL', name: 'Poland', currency: 'PLN' },
    { code: 'NO', name: 'Norway', currency: 'NOK' },
    { code: 'DK', name: 'Denmark', currency: 'DKK' },
    { code: 'FI', name: 'Finland', currency: 'EUR' },
    { code: 'AT', name: 'Austria', currency: 'EUR' },
    { code: 'PT', name: 'Portugal', currency: 'EUR' },
    { code: 'GR', name: 'Greece', currency: 'EUR' },
    { code: 'IE', name: 'Ireland', currency: 'EUR' },
    { code: 'CZ', name: 'Czech Republic', currency: 'CZK' },
    { code: 'RO', name: 'Romania', currency: 'RON' },
    { code: 'HU', name: 'Hungary', currency: 'HUF' },
    { code: 'BG', name: 'Bulgaria', currency: 'BGN' },
    { code: 'HR', name: 'Croatia', currency: 'EUR' },
    { code: 'SK', name: 'Slovak Republic', currency: 'EUR' },
    { code: 'SI', name: 'Slovenia', currency: 'EUR' },
    { code: 'LT', name: 'Lithuania', currency: 'EUR' },
    { code: 'LV', name: 'Latvia', currency: 'EUR' },
    { code: 'EE', name: 'Estonia', currency: 'EUR' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN' },
    { code: 'EG', name: 'Egypt', currency: 'EGP' },
    { code: 'KE', name: 'Kenya', currency: 'KES' },
    { code: 'MA', name: 'Morocco', currency: 'MAD' },
    { code: 'DZ', name: 'Algeria', currency: 'DZD' },
    { code: 'TN', name: 'Tunisia', currency: 'TND' },
    { code: 'GA', name: 'Gabon', currency: 'XAF' },
    { code: 'CI', name: 'Ivory Coast', currency: 'XOF' },
    { code: 'SN', name: 'Senegal', currency: 'XOF' },
    { code: 'GH', name: 'Ghana', currency: 'GHS' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
    { code: 'UG', name: 'Uganda', currency: 'UGX' },
    { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
    { code: 'IL', name: 'Israel', currency: 'ILS' },
    { code: 'TR', name: 'Turkey', currency: 'TRY' },
    { code: 'TH', name: 'Thailand', currency: 'THB' },
    { code: 'MY', name: 'Malaysia', currency: 'MYR' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' },
    { code: 'ID', name: 'Indonesia', currency: 'IDR' },
    { code: 'PH', name: 'Philippines', currency: 'PHP' },
    { code: 'VN', name: 'Vietnam', currency: 'VND' },
    { code: 'PK', name: 'Pakistan', currency: 'PKR' },
    { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
    { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
    { code: 'AR', name: 'Argentina', currency: 'ARS' },
    { code: 'CL', name: 'Chile', currency: 'CLP' },
    { code: 'CO', name: 'Colombia', currency: 'COP' },
    { code: 'PE', name: 'Peru', currency: 'PEN' },
    { code: 'VE', name: 'Venezuela', currency: 'VES' },
];

async function addCountriesWithCurrencies() {
    try {
        console.log('Recherche d\'un utilisateur valide...');
        
        // Trouver un utilisateur pour la session
        const user = await prisma.tUtilisateurs.findFirst({
            orderBy: { id: 'asc' }
        });
        
        if (!user) {
            console.error('❌ Aucun utilisateur trouvé!');
            return;
        }
        
        console.log('✅ Utilisateur trouvé:', user.nomUtilisateur, '(ID:', user.id + ')');
        
        // Charger toutes les devises
        console.log('\nChargement des devises...');
        const allDevises = await prisma.tDevises.findMany({
            select: { id: true, codeDevise: true }
        });
        const devisesMap = new Map(allDevises.map(d => [d.codeDevise, d.id]));
        console.log(`✅ ${allDevises.length} devises chargées`);
        
        let created = 0;
        let skipped = 0;
        let errors = 0;
        
        console.log('\nAjout des pays...\n');
        
        for (const country of countriesWithCurrencies) {
            try {
                // Vérifier si le pays existe déjà
                const existing = await prisma.tPays.findFirst({
                    where: { codePays: country.code }
                });
                
                if (existing) {
                    console.log(`⏭️  ${country.code} - ${country.name} existe déjà`);
                    skipped++;
                    continue;
                }
                
                // Trouver l'ID de la devise
                const deviseId = devisesMap.get(country.currency);
                
                if (!deviseId) {
                    console.log(`⚠️  ${country.code} - ${country.name}: Devise ${country.currency} non trouvée, utilisation de la devise par défaut (0)`);
                }
                
                // Créer le pays
                await prisma.tPays.create({
                    data: {
                        codePays: country.code,
                        libellePays: country.name,
                        deviseLocale: deviseId || 0,
                        session: user.id,
                        dateCreation: new Date()
                    }
                });
                
                console.log(`✅ ${country.code} - ${country.name} (${country.currency})`);
                created++;
                
            } catch (error) {
                console.error(`❌ Erreur pour ${country.code}:`, error.message);
                errors++;
            }
        }
        
        console.log('\n📊 Résumé:');
        console.log(`  - Créés: ${created}`);
        console.log(`  - Ignorés (déjà existants): ${skipped}`);
        console.log(`  - Erreurs: ${errors}`);
        console.log(`  - Total: ${countriesWithCurrencies.length}`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addCountriesWithCurrencies();
