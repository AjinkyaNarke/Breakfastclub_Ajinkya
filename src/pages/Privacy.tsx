
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


const Privacy = () => {
  const { data: privacyContent, isLoading } = useQuery({
    queryKey: ['content-blocks', 'privacy_policy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'privacy_policy')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const { data: businessInfo, isLoading: businessLoading } = useQuery({
    queryKey: ['content-blocks', 'business_info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'business_info')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      return data;
    },
  });

  const { data: contactInfo, isLoading: contactLoading } = useQuery({
    queryKey: ['content-blocks', 'contact_details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .eq('section_name', 'contact_details')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      return data;
    },
  });

  if (isLoading || businessLoading || contactLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Extract business information from admin panel data
  const getBusinessName = () => {
    if (businessInfo?.content) {
      const match = businessInfo.content.match(/Restaurant:\s*\[?([^\]\n]+)\]?/);
      return match ? match[1] : "Unser Restaurant";
    }
    return "Unser Restaurant";
  };

  const getContactEmail = () => {
    if (contactInfo?.content) {
      const match = contactInfo.content.match(/E-Mail:\s*\[?([^\]\n]+)\]?/);
      return match ? match[1] : "kontakt@restaurant.de";
    }
    return "kontakt@restaurant.de";
  };

  const getBusinessAddress = () => {
    if (businessInfo?.content) {
      const match = businessInfo.content.match(/Adresse:\s*\[?([^\]\n]+)\]?/);
      return match ? match[1] : "Ihre Geschäftsadresse";
    }
    return "Ihre Geschäftsadresse";
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <main>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
          
          <div className="prose prose-lg max-w-none space-y-8 text-foreground">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Datenschutz auf einen Blick</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">Allgemeine Hinweise</h3>
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
                  passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
                  persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen 
                  Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                </p>
                
                <h3 className="text-xl font-medium text-foreground">Datenerfassung auf dieser Website</h3>
                <p>
                  <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber {getBusinessName()}. 
                  Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                </p>
                
                <p>
                  <strong>Wie erfassen wir Ihre Daten?</strong><br />
                  Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich 
                  z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch 
                  oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind 
                  vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
                </p>
              </div>
            </section>

            {/* Responsible Party */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Allgemeine Hinweise und Pflichtinformationen</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">Datenschutz</h3>
                <p>
                  Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln 
                  Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften 
                  sowie dieser Datenschutzerklärung.
                </p>
                
                <p>
                  Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. 
                  Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. 
                  Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. 
                  Sie erläutert auch, wie und zu welchem Zweck das geschieht.
                </p>

                <h3 className="text-xl font-medium text-foreground">Verantwortliche Stelle</h3>
                <p>
                  Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
                  {getBusinessName()}<br />
                  {getBusinessAddress()}<br />
                  E-Mail: {getContactEmail()}
                </p>
                
                <p>
                  Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam 
                  mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten 
                  (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
                </p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Datenerfassung auf dieser Website</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">Server-Log-Dateien</h3>
                <p>
                  Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten 
                  Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Browsertyp und Browserversion</li>
                  <li>Verwendetes Betriebssystem</li>
                  <li>Referrer URL</li>
                  <li>Hostname des zugreifenden Rechners</li>
                  <li>Uhrzeit der Serveranfrage</li>
                  <li>IP-Adresse</li>
                </ul>
                <p>
                  Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. 
                  Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. 
                  Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung 
                  und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
                </p>

                <h3 className="text-xl font-medium text-foreground">Cookies</h3>
                <p>
                  Diese Website verwendet nur technisch notwendige Cookies. Diese sind erforderlich, 
                  um die Website ordnungsgemäß zu betreiben und ihre Sicherheit zu gewährleisten. 
                  Technisch notwendige Cookies werden automatisch gesetzt und erfordern keine Einwilligung.
                </p>
                <p>
                  <strong>Welche Cookies verwenden wir:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Session-Cookies für die grundlegende Funktionalität der Website</li>
                  <li>Sicherheitscookies zum Schutz vor Angriffen</li>
                </ul>
                <p>
                  <strong>Wir verwenden keine:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Tracking-Cookies</li>
                  <li>Marketing-Cookies</li>
                  <li>Analyse-Tools wie Google Analytics</li>
                  <li>Social Media Plugins</li>
                </ul>
              </div>
            </section>

            {/* Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Ihre Rechte</h2>
              <div className="space-y-4">
                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                
                <h3 className="text-xl font-medium text-foreground">Auskunftsrecht</h3>
                <p>
                  Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende Daten verarbeitet 
                  werden und auf Auskunft über diese Daten sowie auf weitere Informationen und Kopie der Daten 
                  entsprechend Art. 15 DSGVO.
                </p>

                <h3 className="text-xl font-medium text-foreground">Recht auf Berichtigung</h3>
                <p>
                  Sie haben ein Recht auf Berichtigung und/oder Vervollständigung gegenüber dem Verantwortlichen, 
                  sofern die verarbeiteten personenbezogenen Daten, die Sie betreffen, unrichtig oder unvollständig sind.
                </p>

                <h3 className="text-xl font-medium text-foreground">Recht auf Löschung</h3>
                <p>
                  Sie haben nach Maßgabe des Art. 17 DSGVO das Recht zu verlangen, dass betreffende Daten 
                  unverzüglich gelöscht werden.
                </p>

                <h3 className="text-xl font-medium text-foreground">Widerspruchsrecht</h3>
                <p>
                  Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, 
                  jederzeit gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten Widerspruch einzulegen.
                </p>

                <h3 className="text-xl font-medium text-foreground">Beschwerderecht</h3>
                <p>
                  Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht 
                  Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat 
                  ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Kontakt</h2>
              <p>
                Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer personenbezogenen Daten, 
                bei Auskünften, Berichtigung, Sperrung oder Löschung von Daten wenden Sie sich bitte an:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p>
                  {getBusinessName()}<br />
                  {getBusinessAddress()}<br />
                  E-Mail: {getContactEmail()}
                </p>
              </div>
            </section>

            {/* Custom content from admin panel */}
            {privacyContent && privacyContent.content && (
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Zusätzliche Informationen</h2>
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {privacyContent.content}
                </div>
              </section>
            )}

            <div className="text-sm text-muted-foreground mt-8 pt-8 border-t">
              <p>
                Stand dieser Datenschutzerklärung: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
