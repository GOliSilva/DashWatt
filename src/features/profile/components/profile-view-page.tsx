import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function ProfileViewPage() {
  return (
    <div className='flex w-full flex-col p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Autenticacao desativada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Substitua este conteudo por seu proprio perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
