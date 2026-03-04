import { Suspense } from "react";
import { getConversionById } from "@/modules/conversion/server/actions";
import { getTauxChangeByConversion } from "@/modules/conversion/server/taux-change-actions";
import { ConversionIdView, ConversionIdLoadingView, ConversionIdErrorView } from "@/modules/conversion/ui/views/conversion-id-view";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ConversionDetailPage({ params }: PageProps) {
    const { id } = await params;
    
    const [conversionResult, tauxResult] = await Promise.all([
        getConversionById(id),
        getTauxChangeByConversion(id)
    ]);

    if (!conversionResult.success || !conversionResult.data) {
        return <ConversionIdErrorView />;
    }

    return (
        <div className="flex flex-col h-full">
            <Suspense fallback={<ConversionIdLoadingView />}>
                <ConversionIdView 
                    conversion={conversionResult.data} 
                    tauxList={tauxResult.data || []} 
                />
            </Suspense>
        </div>
    );
}
