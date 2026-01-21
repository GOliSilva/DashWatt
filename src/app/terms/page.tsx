export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Termos de Serviço</h1>
      
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Aceite dos Termos</h2>
          <p className="text-muted-foreground">
            Ao acessar e usar este serviço, você aceita e concorda em ficar vinculado aos 
            termos e condições deste acordo.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Uso do Serviço</h2>
          <p className="text-muted-foreground">
            Este serviço é fornecido para uso interno da empresa. O acesso não autorizado 
            é estritamente proibido.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Privacidade</h2>
          <p className="text-muted-foreground">
            Respeitamos sua privacidade e protegemos suas informações de acordo com as 
            leis aplicáveis de proteção de dados.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Modificações</h2>
          <p className="text-muted-foreground">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            Continuação do uso após modificações constitui aceitação dos novos termos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Contato</h2>
          <p className="text-muted-foreground">
            Para questões sobre estes termos, entre em contato através dos canais oficiais 
            da empresa.
          </p>
        </section>
      </div>
    </div>
  );
}
