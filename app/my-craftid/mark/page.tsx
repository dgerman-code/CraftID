import { localeQuery } from "@/lib/i18n";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedCraftId, ownerWorkspaceQuery } from "@/lib/owned-craftid";
import { localeFrom } from "@/components/site-shell";
import { getSiteUrl } from "@/lib/site-url";
import { formatCraftId } from "@/lib/craftid-format";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ lang?: string; entity?: string }> };

const copy = {
  en: {
    eyebrow: "CraftID Download Kit", title: "Download the materials for this CraftID.",
    intro: "Every file is generated for the selected Professional or Workshop record. The QR code in ordinary CraftID assets points to that record's unique public profile.",
    back: "Back to My CraftID",
    publicWarning: "This CraftID is not published yet. You can prepare owner-only files, but the public profile and website badge will not resolve until the record is published.",
    publicReady: "The public CraftID profile is available.", profile: "Public profile", openProfile: "Open public profile",
    rule: "Ordinary CraftID assets contain the CraftID identifier and QR only. Certificate No. is used only on an issued certificate.",
    sticker: "Round Sticker / Seal", stickerText: "For packaging, workshop doors, product presentation and printed materials.", downloadSticker: "Download Round Sticker (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "For product packaging, workshop presentation and print materials. Includes country, CraftID and QR code.", downloadCraftedInSvg: "Download Crafted in Mark (SVG)", downloadCraftedInPng: "Download Crafted in Mark (PNG)", craftedInCountryMissing: "Add a country to this CraftID profile to generate this mark.", editWorkshopProfile: "Open profile",
    qrCode: "Standalone QR Code", qrCodeText: "A clean QR code for layouts where the Round Sticker / Seal is not suitable. It opens this CraftID's unique public profile.", downloadQrCode: "Download QR Code (PNG)",
    printSheet: "Print Sheet", printSheetText: "A4 sheet with multiple Round Sticker / Seal marks ready for printing.", downloadPrintSheet: "Download Print Sheet (PDF)",
    website: "Website Embed Badge", websiteText: "The website badge uses the same Round Sticker / Seal design and links to the public profile.",
    embed: "Embed code", copyHint: "Copy this HTML into your website.",
    certificate: "Certificate", certificateText: "Certificates are versioned documents. Certificate No. appears only on the certificate. On the approved Professional certificate, the QR opens the corresponding public CraftID profile.",
    manageCertificate: "Open Certificate area",
    domainWarning: "The final QR target is craftid.eu. Do not mass-print permanent materials from a preview deployment.",
  },
  fr: {
    eyebrow: "Kit de téléchargement CraftID", title: "Téléchargez les supports pour ce CraftID.",
    intro: "Chaque fichier est généré pour le dossier Professional ou Workshop sélectionné. Le QR des supports CraftID ordinaires pointe vers le profil public unique de ce dossier.",
    back: "Retour à Mon CraftID",
    publicWarning: "Ce CraftID n’est pas encore publié. Vous pouvez préparer les fichiers réservés au titulaire, mais le profil public et le badge web ne fonctionneront qu’après publication.",
    publicReady: "Le profil public CraftID est disponible.", profile: "Profil public", openProfile: "Ouvrir le profil public",
    rule: "Les supports CraftID ordinaires contiennent uniquement l’identifiant CraftID et le QR. Le Certificate No. apparaît uniquement sur un certificat émis.",
    sticker: "Autocollant rond / Sceau", stickerText: "Pour emballages, portes d’atelier, présentation des produits et supports imprimés.", downloadSticker: "Télécharger l’autocollant rond (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Pour les emballages de produits, la présentation de l’atelier et les supports imprimés. Comprend le pays, le CraftID et le QR code.", downloadCraftedInSvg: "Télécharger le Crafted in Mark (SVG)", downloadCraftedInPng: "Télécharger le Crafted in Mark (PNG)", craftedInCountryMissing: "Ajoutez un pays à ce profil CraftID pour générer cette marque.", editWorkshopProfile: "Ouvrir le profil",
    qrCode: "QR Code séparé", qrCodeText: "Un QR propre pour les mises en page où l’autocollant rond / sceau ne convient pas. Il ouvre le profil public unique de ce CraftID.", downloadQrCode: "Télécharger le QR Code (PNG)",
    printSheet: "Feuille d’impression", printSheetText: "Feuille A4 avec plusieurs autocollants ronds / sceaux prêts à imprimer.", downloadPrintSheet: "Télécharger la feuille d’impression (PDF)",
    website: "Badge à intégrer au site web", websiteText: "Le badge web reprend le même design que l’autocollant rond / sceau et renvoie vers le profil public.",
    embed: "Code d’intégration", copyHint: "Copiez ce code HTML dans votre site web.",
    certificate: "Certificat", certificateText: "Les certificats sont des documents versionnés. Le Certificate No. apparaît uniquement sur le certificat. Sur le certificat Professional approuvé, le QR ouvre le profil public CraftID correspondant.",
    manageCertificate: "Ouvrir l’espace Certificat",
    domainWarning: "La destination finale du QR est craftid.eu. Ne lancez pas d’impression en série de supports permanents depuis un déploiement de prévisualisation.",
  },
  de: {
    eyebrow: "CraftID Download Kit", title: "Laden Sie die Materialien für diese CraftID herunter.",
    intro: "Jede Datei wird für den ausgewählten Professional- oder Workshop-Datensatz erzeugt. Der QR-Code in normalen CraftID-Materialien führt zum eindeutigen öffentlichen Profil dieses Datensatzes.",
    back: "Zurück zu Meine CraftID",
    publicWarning: "Diese CraftID ist noch nicht veröffentlicht. Sie können Dateien für den Inhaber vorbereiten, aber öffentliches Profil und Website-Badge funktionieren erst nach der Veröffentlichung.",
    publicReady: "Das öffentliche CraftID-Profil ist verfügbar.", profile: "Öffentliches Profil", openProfile: "Öffentliches Profil öffnen",
    rule: "Normale CraftID-Materialien enthalten nur CraftID-Kennung und QR. Die Certificate No. erscheint ausschließlich auf einem ausgestellten Zertifikat.",
    sticker: "Runder Aufkleber / Siegel", stickerText: "Für Verpackungen, Werkstatttüren, Produktpräsentation und Druckmaterialien.", downloadSticker: "Runden Aufkleber herunterladen (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Für Produktverpackungen, Werkstattpräsentation und Druckmaterialien. Enthält Land, CraftID und QR-Code.", downloadCraftedInSvg: "Crafted in Mark herunterladen (SVG)", downloadCraftedInPng: "Crafted in Mark herunterladen (PNG)", craftedInCountryMissing: "Fügen Sie diesem CraftID-Profil ein Land hinzu, um diese Marke zu erstellen.", editWorkshopProfile: "Profil öffnen",
    qrCode: "Separater QR-Code", qrCodeText: "Ein sauberer QR-Code für Layouts, in denen der runde Aufkleber / das Siegel nicht passt. Er öffnet das eindeutige öffentliche Profil dieser CraftID.", downloadQrCode: "QR-Code herunterladen (PNG)",
    printSheet: "Druckbogen", printSheetText: "A4-Bogen mit mehreren runden Aufklebern / Siegeln, druckfertig.", downloadPrintSheet: "Druckbogen herunterladen (PDF)",
    website: "Website Embed Badge", websiteText: "Das Website-Badge verwendet dasselbe Design wie der runde Aufkleber / das Siegel und verlinkt auf das öffentliche Profil.",
    embed: "Einbettungscode", copyHint: "Kopieren Sie diesen HTML-Code in Ihre Website.",
    certificate: "Zertifikat", certificateText: "Zertifikate sind versionierte Dokumente. Die Certificate No. steht nur auf dem Zertifikat. Beim freigegebenen Professional-Zertifikat öffnet der QR das zugehörige öffentliche CraftID-Profil.",
    manageCertificate: "Zertifikatsbereich öffnen",
    domainWarning: "Das endgültige QR-Ziel ist craftid.eu. Drucken Sie keine dauerhaften Materialien in großer Stückzahl aus einer Vorschau-Bereitstellung.",
  },
  nl: {
    eyebrow: "CraftID Download Kit", title: "Download de materialen voor deze CraftID.",
    intro: "Elk bestand wordt gegenereerd voor het geselecteerde Professional- of Workshop-dossier. De QR-code in gewone CraftID-materialen verwijst naar het unieke openbare profiel van dat dossier.",
    back: "Terug naar Mijn CraftID",
    publicWarning: "Deze CraftID is nog niet gepubliceerd. U kunt bestanden voor de eigenaar voorbereiden, maar het openbare profiel en de websitebadge werken pas na publicatie.",
    publicReady: "Het openbare CraftID-profiel is beschikbaar.", profile: "Openbaar profiel", openProfile: "Openbaar profiel openen",
    rule: "Gewone CraftID-materialen bevatten alleen de CraftID-identificatie en QR. Certificate No. wordt alleen op een uitgegeven certificaat gebruikt.",
    sticker: "Ronde sticker / zegel", stickerText: "Voor verpakking, werkplaatsdeuren, productpresentatie en drukwerk.", downloadSticker: "Ronde sticker downloaden (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Voor productverpakkingen, werkplaatspresentatie en drukwerk. Bevat land, CraftID en QR-code.", downloadCraftedInSvg: "Crafted in Mark downloaden (SVG)", downloadCraftedInPng: "Crafted in Mark downloaden (PNG)", craftedInCountryMissing: "Voeg een land toe aan dit CraftID-profiel om deze markering te genereren.", editWorkshopProfile: "Profiel openen",
    qrCode: "Losse QR-code", qrCodeText: "Een schone QR-code voor layouts waar de ronde sticker / het zegel niet geschikt is. Deze opent het unieke openbare profiel van deze CraftID.", downloadQrCode: "QR-code downloaden (PNG)",
    printSheet: "Printvel", printSheetText: "A4-vel met meerdere ronde stickers / zegels, klaar om te printen.", downloadPrintSheet: "Printvel downloaden (PDF)",
    website: "Website Embed Badge", websiteText: "De websitebadge gebruikt hetzelfde ontwerp als de ronde sticker / het zegel en linkt naar het openbare profiel.",
    embed: "Embedcode", copyHint: "Kopieer deze HTML-code naar uw website.",
    certificate: "Certificaat", certificateText: "Certificaten zijn versiegebonden documenten. Certificate No. staat alleen op het certificaat. Op het goedgekeurde Professional-certificaat opent de QR het bijbehorende openbare CraftID-profiel.",
    manageCertificate: "Certificaatgedeelte openen",
    domainWarning: "Het definitieve QR-doel is craftid.eu. Laat geen permanente materialen in grote oplage drukken vanaf een previewdeployment.",
  },
  pl: {
    eyebrow: "CraftID Download Kit", title: "Pobierz materiały dla tego CraftID.",
    intro: "Każdy plik jest generowany dla wybranego zapisu Professional lub Workshop. Kod QR w standardowych materiałach CraftID prowadzi do unikalnego publicznego profilu tego zapisu.",
    back: "Wróć do Mój CraftID",
    publicWarning: "Ten CraftID nie jest jeszcze opublikowany. Możesz przygotować pliki dla właściciela, ale profil publiczny i badge na stronę zaczną działać dopiero po publikacji.",
    publicReady: "Publiczny profil CraftID jest dostępny.", profile: "Profil publiczny", openProfile: "Otwórz profil publiczny",
    rule: "Standardowe materiały CraftID zawierają tylko identyfikator CraftID i QR. Certificate No. jest używany wyłącznie na wydanym certyfikacie.",
    sticker: "Okrągła naklejka / znak", stickerText: "Do opakowań, drzwi pracowni, prezentacji produktów i materiałów drukowanych.", downloadSticker: "Pobierz okrągłą naklejkę (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Do opakowań produktów, prezentacji pracowni i materiałów drukowanych. Zawiera kraj, CraftID i kod QR.", downloadCraftedInSvg: "Pobierz Crafted in Mark (SVG)", downloadCraftedInPng: "Pobierz Crafted in Mark (PNG)", craftedInCountryMissing: "Dodaj kraj do tego profilu CraftID, aby wygenerować ten znak.", editWorkshopProfile: "Otwórz profil",
    qrCode: "Oddzielny kod QR", qrCodeText: "Czysty kod QR do układów, w których okrągła naklejka / znak nie pasuje. Otwiera unikalny publiczny profil tego CraftID.", downloadQrCode: "Pobierz kod QR (PNG)",
    printSheet: "Arkusz do druku", printSheetText: "Arkusz A4 z wieloma okrągłymi naklejkami / znakami gotowymi do druku.", downloadPrintSheet: "Pobierz arkusz do druku (PDF)",
    website: "Badge do osadzenia na stronie", websiteText: "Badge internetowy korzysta z tego samego projektu co okrągła naklejka / znak i prowadzi do profilu publicznego.",
    embed: "Kod osadzania", copyHint: "Skopiuj ten kod HTML na swoją stronę.",
    certificate: "Certyfikat", certificateText: "Certyfikaty są dokumentami wersjonowanymi. Certificate No. występuje tylko na certyfikacie. Na zatwierdzonym certyfikacie Professional kod QR otwiera odpowiedni publiczny profil CraftID.",
    manageCertificate: "Otwórz sekcję Certyfikat",
    domainWarning: "Docelowy adres QR to craftid.eu. Nie drukuj masowo trwałych materiałów z wersji podglądowej.",
  },
  it: {
    eyebrow: "CraftID Download Kit", title: "Scarica i materiali per questo CraftID.",
    intro: "Ogni file è generato per il record Professional o Workshop selezionato. Il QR nei normali materiali CraftID punta al profilo pubblico univoco di quel record.",
    back: "Torna a Il mio CraftID",
    publicWarning: "Questo CraftID non è ancora pubblicato. Puoi preparare i file riservati al titolare, ma profilo pubblico e badge web funzioneranno solo dopo la pubblicazione.",
    publicReady: "Il profilo pubblico CraftID è disponibile.", profile: "Profilo pubblico", openProfile: "Apri profilo pubblico",
    rule: "I normali materiali CraftID contengono solo identificatore CraftID e QR. Certificate No. compare esclusivamente su un certificato emesso.",
    sticker: "Adesivo rotondo / sigillo", stickerText: "Per imballaggi, porte del laboratorio, presentazione dei prodotti e materiali stampati.", downloadSticker: "Scarica adesivo rotondo (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Per imballaggi dei prodotti, presentazione del laboratorio e materiali stampati. Include paese, CraftID e codice QR.", downloadCraftedInSvg: "Scarica Crafted in Mark (SVG)", downloadCraftedInPng: "Scarica Crafted in Mark (PNG)", craftedInCountryMissing: "Aggiungi un paese a questo profilo CraftID per generare questo marchio.", editWorkshopProfile: "Apri profilo",
    qrCode: "QR Code separato", qrCodeText: "Un QR pulito per layout in cui l’adesivo rotondo / sigillo non è adatto. Apre il profilo pubblico univoco di questo CraftID.", downloadQrCode: "Scarica QR Code (PNG)",
    printSheet: "Foglio di stampa", printSheetText: "Foglio A4 con più adesivi rotondi / sigilli pronti per la stampa.", downloadPrintSheet: "Scarica foglio di stampa (PDF)",
    website: "Website Embed Badge", websiteText: "Il badge web usa lo stesso design dell’adesivo rotondo / sigillo e collega al profilo pubblico.",
    embed: "Codice di incorporamento", copyHint: "Copia questo HTML nel tuo sito web.",
    certificate: "Certificato", certificateText: "I certificati sono documenti versionati. Certificate No. compare solo sul certificato. Nel certificato Professional approvato, il QR apre il relativo profilo pubblico CraftID.",
    manageCertificate: "Apri area Certificato",
    domainWarning: "La destinazione finale del QR è craftid.eu. Non stampare in massa materiali permanenti da un deployment di anteprima.",
  },
  es: {
    eyebrow: "CraftID Download Kit", title: "Descarga los materiales para este CraftID.",
    intro: "Cada archivo se genera para el registro Professional o Workshop seleccionado. El QR de los materiales CraftID ordinarios apunta al perfil público único de ese registro.",
    back: "Volver a Mi CraftID",
    publicWarning: "Este CraftID aún no está publicado. Puedes preparar archivos para el titular, pero el perfil público y el badge web no funcionarán hasta que se publique.",
    publicReady: "El perfil público CraftID está disponible.", profile: "Perfil público", openProfile: "Abrir perfil público",
    rule: "Los materiales CraftID ordinarios contienen solo el identificador CraftID y el QR. Certificate No. se utiliza únicamente en un certificado emitido.",
    sticker: "Pegatina redonda / sello", stickerText: "Para embalajes, puertas del taller, presentación de productos y materiales impresos.", downloadSticker: "Descargar pegatina redonda (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Para embalajes de productos, presentación del taller y materiales impresos. Incluye país, CraftID y código QR.", downloadCraftedInSvg: "Descargar Crafted in Mark (SVG)", downloadCraftedInPng: "Descargar Crafted in Mark (PNG)", craftedInCountryMissing: "Añade un país a este perfil CraftID para generar esta marca.", editWorkshopProfile: "Abrir perfil",
    qrCode: "Código QR independiente", qrCodeText: "Un QR limpio para diseños en los que la pegatina redonda / sello no sea adecuada. Abre el perfil público único de este CraftID.", downloadQrCode: "Descargar código QR (PNG)",
    printSheet: "Hoja de impresión", printSheetText: "Hoja A4 con varias pegatinas redondas / sellos listas para imprimir.", downloadPrintSheet: "Descargar hoja de impresión (PDF)",
    website: "Website Embed Badge", websiteText: "El badge web usa el mismo diseño que la pegatina redonda / sello y enlaza al perfil público.",
    embed: "Código de inserción", copyHint: "Copia este HTML en tu sitio web.",
    certificate: "Certificado", certificateText: "Los certificados son documentos versionados. Certificate No. aparece solo en el certificado. En el certificado Professional aprobado, el QR abre el perfil público CraftID correspondiente.",
    manageCertificate: "Abrir área de Certificado",
    domainWarning: "El destino final del QR es craftid.eu. No imprimas en masa materiales permanentes desde un deployment de vista previa.",
  },
  uk: {
    eyebrow: "CraftID Download Kit", title: "Завантажте матеріали для цього CraftID.",
    intro: "Кожен файл генерується для вибраного запису Professional або Workshop. QR-код у звичайних матеріалах CraftID веде на унікальний публічний профіль саме цього запису.",
    back: "Назад до Мій CraftID",
    publicWarning: "Цей CraftID ще не опубліковано. Власник може підготувати файли, але публічний профіль і website badge запрацюють лише після публікації запису.",
    publicReady: "Публічний профіль CraftID доступний.", profile: "Публічний профіль", openProfile: "Відкрити публічний профіль",
    rule: "Звичайні матеріали CraftID містять тільки ідентифікатор CraftID і QR. Certificate No. використовується лише на випущеному сертифікаті.",
    sticker: "Round Sticker / Seal", stickerText: "Для пакування, дверей майстерні, презентації виробів і друкованих матеріалів.", downloadSticker: "Завантажити Round Sticker (SVG)",
    craftedIn: "Crafted in Mark", craftedInText: "Для пакування виробів, презентації майстерні та друкованих матеріалів. Містить країну, CraftID і QR-код.", downloadCraftedInSvg: "Завантажити Crafted in Mark (SVG)", downloadCraftedInPng: "Завантажити Crafted in Mark (PNG)", craftedInCountryMissing: "Додайте країну до цього профілю CraftID, щоб згенерувати цей знак.", editWorkshopProfile: "Відкрити профіль",
    qrCode: "Окремий QR-код", qrCodeText: "Чистий QR-код для макетів, де Round Sticker / Seal не підходить. Він відкриває унікальний публічний профіль цього CraftID.", downloadQrCode: "Завантажити QR-код (PNG)",
    printSheet: "Print Sheet", printSheetText: "Аркуш A4 з кількома Round Sticker / Seal для друку.", downloadPrintSheet: "Завантажити Print Sheet (PDF)",
    website: "Website Embed Badge", websiteText: "Website badge використовує той самий дизайн Round Sticker / Seal і веде на публічний профіль.",
    embed: "Код для вставки", copyHint: "Скопіюйте цей HTML-код на свій вебсайт.",
    certificate: "Certificate", certificateText: "Сертифікати є версійними документами. Certificate No. вказується тільки на сертифікаті. У затвердженому сертифікаті Professional QR веде на відповідний публічний профіль CraftID.",
    manageCertificate: "Відкрити розділ Certificate",
    domainWarning: "Фінальна QR-адреса — craftid.eu. Не запускайте масовий друк постійних матеріалів із preview deployment.",
  },
} as const;

export default async function CraftIdMarkPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale = localeFrom(sp.lang);
  const t = copy[locale];
  const { userId, entity, supabase } = await getOwnedCraftId(sp.entity);

  if (!userId) redirect(`/login${localeQuery(locale)}`);
  if (sp.entity && !entity) redirect(`/my-craftid${localeQuery(locale)}`);
  if (!entity) redirect(`/onboarding${localeQuery(locale)}`);

  const q = ownerWorkspaceQuery(locale, entity.id);
  const craftId = formatCraftId(entity.craftid_number, entity.craftid_check_digits);
  const siteUrl = getSiteUrl();
  const profileUrl = new URL("id/" + craftId, siteUrl).toString();

  const profileCountry =
    entity.entity_type === "workshop"
      ? await supabase
          .from("workshop_profiles")
          .select("country_code")
          .eq("entity_id", entity.id)
          .maybeSingle()
      : await supabase
          .from("professional_profiles")
          .select("country_code")
          .eq("entity_id", entity.id)
          .maybeSingle();
  const profileCountryCode =
    profileCountry.data?.country_code?.trim().toUpperCase() || null;

  const stickerPreview = `/api/kit/sticker?entity=${encodeURIComponent(entity.id)}`;
  const stickerDownload = stickerPreview + "&download=1";
  const qrCodePreview = `/api/kit/qr?entity=${encodeURIComponent(entity.id)}`;
  const qrCodeDownload = qrCodePreview + "&download=1";
  const printSheetDownload = `/api/kit/print-sheet?entity=${encodeURIComponent(entity.id)}`;
  const craftedInBase = `/api/kit/crafted-in?entity=${encodeURIComponent(entity.id)}`;
  const craftedInPreview = craftedInBase + "&format=png";
  const craftedInSvgDownload = craftedInBase + "&format=svg&download=1";
  const craftedInPngDownload = craftedInBase + "&format=png&download=1";

  const publicBadgeUrl = new URL(
    "api/mark/badge?craftId=" + encodeURIComponent(craftId),
    siteUrl,
  ).toString();

  const embed = `<a href="${profileUrl}" rel="me noopener" target="_blank"><img src="${publicBadgeUrl}" alt="CraftID #${craftId}" width="180" height="180"></a>`;

  const isTemporaryDomain =
    siteUrl.includes("vercel.app") || siteUrl.includes("localhost");

  return (
    <main className="workspacePage markWorkspace">
      <div className="container workspaceNarrow">
        <Link className="backLink" href={"/my-craftid" + q}>← {t.back}</Link>
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p className="workspaceIntro">{t.intro}</p>

        <p className={entity.public_status === "published" ? "formMessage" : "privacyNote"}>
          {entity.public_status === "published" ? t.publicReady : t.publicWarning}
        </p>
        <p className="privacyNote">{t.rule}</p>
        {isTemporaryDomain ? <p className="privacyNote markDomainWarning">{t.domainWarning}</p> : null}

        <section className="markCodeSection">
          <div className="eyebrow">{t.profile}</div>
          <code>{profileUrl}</code>
          {entity.public_status === "published" ? (
            <div className="markButtonRow">
              <Link
                className="button"
                href={`/id/${craftId}${localeQuery(locale)}`}
              >
                {t.openProfile}
              </Link>
            </div>
          ) : null}
        </section>

        <section className="markGrid">
          <article className="markPanel">
            <div className="eyebrow">{t.sticker}</div>
            <p>{t.stickerText}</p>
            <img
              className="craftIdBadgePreview"
              src={stickerPreview}
              alt={`CraftID #${craftId} round sticker`}
            />
            <a className="button markAssetButton" href={stickerDownload}>
              {t.downloadSticker}
            </a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.craftedIn}</div>
            <p>{t.craftedInText}</p>
            {profileCountryCode ? (
              <>
                <img
                  className="craftIdBadgePreview"
                  src={craftedInPreview}
                  alt={`Crafted in ${profileCountryCode} mark for CraftID #${craftId}`}
                />
                <div className="markButtonRow">
                  <a className="button markAssetButton" href={craftedInSvgDownload}>
                    {t.downloadCraftedInSvg}
                  </a>
                  <a className="button markAssetButton" href={craftedInPngDownload}>
                    {t.downloadCraftedInPng}
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="privacyNote">{t.craftedInCountryMissing}</p>
                <Link className="button markAssetButton" href={"/my-craftid/profile" + q}>
                  {t.editWorkshopProfile}
                </Link>
              </>
            )}
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.qrCode}</div>
            <p>{t.qrCodeText}</p>
            <img
              className="craftIdBadgePreview"
              src={qrCodePreview}
              alt={`CraftID #${craftId} QR code`}
            />
            <a className="button markAssetButton" href={qrCodeDownload}>
              {t.downloadQrCode}
            </a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.printSheet}</div>
            <p>{t.printSheetText}</p>
            <a className="button markAssetButton" href={printSheetDownload}>
              {t.downloadPrintSheet}
            </a>
          </article>

          <article className="markPanel">
            <div className="eyebrow">{t.certificate}</div>
            <p>{t.certificateText}</p>
            <Link className="button markAssetButton" href={"/my-craftid/certificate" + q}>
              {t.manageCertificate}
            </Link>
          </article>
        </section>

        <section className="markCodeSection">
          <div className="eyebrow">{t.website}</div>
          <p className="fieldHelp">{t.websiteText}</p>
          {entity.public_status === "published" ? (
            <>
              <img
                className="craftIdBadgePreview"
                src={publicBadgeUrl}
                alt={`CraftID #${craftId}`}
              />
              <div className="eyebrow">{t.embed}</div>
              <p className="fieldHelp">{t.copyHint}</p>
              <textarea className="embedCode" readOnly rows={5} value={embed} />
            </>
          ) : (
            <p className="privacyNote">{t.publicWarning}</p>
          )}
        </section>
      </div>
    </main>
  );
}
