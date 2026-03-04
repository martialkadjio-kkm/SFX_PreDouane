"use client";
import { Card, CardContent } from "@/components/ui/card";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { OctagonAlertIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/modules/auth/server/actions";

const formSchema = z.object({
  codeUtilisateur: z.string().min(1, {
    message: "Le code utilisateur est requis.",
  }),
});

export const SignInView = () => {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codeUtilisateur: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);

    try {
      const result = await signIn(data.codeUtilisateur);

      if (!result.success) {
        setError(result.error || 'Code utilisateur invalide');
        setPending(false);
        return;
      }

      // Rediriger vers la page d'accueil
      router.push("/dossiers");
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion");
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <img src={"/logo5.png"} alt="logo" className="h-[150px] w-[150px]" />
            <p className="text-2xl font-semibold text-white">SFX Pre-Douane</p>
          </div>
          <Form {...form}>
            <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Connectez-vous !</h1>
                  <p className="text-muted-foreground text-sm">
                    Entrez votre code utilisateur pour continuer.
                  </p>
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="codeUtilisateur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Utilisateur</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre code utilisateur"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!!error && (
                  <Alert className="bg-destructive/10 border-none">
                    <OctagonAlertIcon className="h-4 w-4 text-destructive!" />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}
                <Button className="w-full" type="submit" disabled={pending}>
                  {pending ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
