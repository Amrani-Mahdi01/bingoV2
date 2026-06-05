/**
 * Editorial buyer-guides ("blog") content — bilingual, repo-based.
 *
 * Guides are evergreen, store-agnostic content (they don't depend on the
 * live product catalogue), so they live here as typed data rather than in
 * the product API. Each guide carries both French and Arabic copy; the
 * route picks the active locale. Add a guide by appending to GUIDES.
 *
 * Slugs are shared across locales (FR at /guides/<slug>, AR at
 * /ar/guides/<slug>) and linked via hreflang.
 */
export type Localized = { fr: string; ar: string };

export type GuideBlock =
  | { type: "h2"; text: Localized }
  | { type: "p"; text: Localized }
  | { type: "ul"; items: Localized[] };

export interface Guide {
  slug: string;
  title: Localized;
  /** Meta description + social excerpt. Keep under ~160 chars. */
  description: Localized;
  /** Short teaser shown on the index cards. */
  excerpt: Localized;
  /** Hero / OG image (absolute URL or /public path). Falls back to the
   *  site default when omitted. */
  image?: string;
  datePublished: string; // ISO date
  dateModified?: string; // ISO date
  readingMinutes: number;
  /** Category slugs this guide links out to (internal linking). */
  relatedCategories?: string[];
  blocks: GuideBlock[];
  faq?: { q: Localized; a: Localized }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "comment-choisir-sa-tente",
    title: {
      fr: "Comment choisir sa tente de camping : le guide complet",
      ar: "كيف تختار خيمة التخييم: الدليل الكامل",
    },
    description: {
      fr: "Capacité, saisonnalité, imperméabilité, poids : tous les critères pour choisir la bonne tente selon votre usage et le climat en Algérie.",
      ar: "السعة، الموسمية، مقاومة الماء، الوزن: كل المعايير لاختيار الخيمة المناسبة حسب استعمالك ومناخ الجزائر.",
    },
    excerpt: {
      fr: "Le guide pour ne pas se tromper : taille, saisons, imperméabilité et budget expliqués simplement.",
      ar: "دليل لتفادي الخطأ: الحجم، المواسم، مقاومة الماء والميزانية بشرح بسيط.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 9,
    relatedCategories: ["tentes-abris"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "La tente est l'achat le plus structurant pour camper sereinement : c'est elle qui vous protège du vent, de la pluie, de la rosée du matin et des insectes. Bien choisie, on l'oublie ; mal choisie, elle gâche tout le séjour. La bonne nouvelle, c'est qu'il suffit de répondre à trois questions pour viser juste : combien serez-vous à dormir dedans, à quelle saison sortez-vous, et comment transporterez-vous la tente jusqu'au campement ? Ce guide détaille chaque critère, puis les erreurs à éviter et nos conseils d'entretien pour qu'elle dure des années.",
          ar: "الخيمة هي أهم اقتناء لتخييم مريح: فهي التي تحميك من الرياح والمطر وندى الصباح والحشرات. إن أحسنت اختيارها نسيتها، وإن أسأت اختيارها أفسدت الرحلة كلها. والخبر الجيّد أنه يكفي الإجابة عن ثلاثة أسئلة لتصيب الهدف: كم شخصًا سينام فيها، في أي موسم تخرج، وكيف ستنقلها إلى المخيم؟ يفصّل هذا الدليل كل معيار، ثم الأخطاء التي يجب تجنّبها ونصائح الصيانة لتدوم سنوات.",
        },
      },
      {
        type: "h2",
        text: { fr: "1. La capacité (nombre de places)", ar: "1. السعة (عدد الأماكن)" },
      },
      {
        type: "p",
        text: {
          fr: "Les fabricants comptent les places « au plus juste » : une tente « 2 places » correspond à deux personnes serrées épaule contre épaule, sans place pour les bagages. Pour du confort — sacs à l'intérieur, matelas larges, espace pour s'habiller — prenez systématiquement une place de plus que le nombre de campeurs. Une tente « 3 places » est ainsi idéale pour 2 adultes avec leurs affaires, et une « 4 places » pour un couple avec deux enfants.",
          ar: "يحسب المصنّعون الأماكن «بالحد الأدنى»: فخيمة «شخصين» تعني شخصين متلاصقين كتفًا إلى كتف، دون مكان للأمتعة. من أجل الراحة — الحقائب بالداخل، فرشات عريضة، مساحة لتبديل الملابس — اختر دائمًا مكانًا إضافيًا عن عدد المخيّمين. فخيمة «3 أماكن» مثالية لشخصين بالغين مع أغراضهما، و«4 أماكن» لزوجين مع طفلين.",
        },
      },
      {
        type: "p",
        text: {
          fr: "Regardez aussi la hauteur sous plafond et la présence d'une abside : cet auvent devant la chambre permet de ranger chaussures et sac à dos à l'abri, sans encombrer l'espace de couchage. Sur un séjour de plusieurs jours, ces détails font une vraie différence de confort.",
          ar: "انظر أيضًا إلى الارتفاع الداخلي ووجود رواق أمامي: هذه المظلّة أمام الغرفة تتيح وضع الأحذية وحقيبة الظهر في مأمن، دون إشغال مساحة النوم. وفي رحلة عدة أيام، تصنع هذه التفاصيل فرقًا حقيقيًا في الراحة.",
        },
      },
      {
        type: "h2",
        text: { fr: "2. La saisonnalité (3 ou 4 saisons)", ar: "2. الموسمية (3 أو 4 مواسم)" },
      },
      {
        type: "ul",
        items: [
          {
            fr: "3 saisons : printemps, été, automne. Bien ventilée, parfaite pour la majorité des sorties en Algérie.",
            ar: "3 مواسم: الربيع، الصيف، الخريف. جيدة التهوية، مثالية لأغلب الخرجات في الجزائر.",
          },
          {
            fr: "4 saisons : renforcée pour le vent et la neige (haute montagne, Tikjda en hiver). Plus lourde et plus chère.",
            ar: "4 مواسم: مُعزّزة ضد الرياح والثلج (الجبال العالية، تيكجدة شتاءً). أثقل وأغلى.",
          },
        ],
      },
      {
        type: "h2",
        text: { fr: "3. L'imperméabilité (colonne d'eau)", ar: "3. مقاومة الماء (عمود الماء)" },
      },
      {
        type: "p",
        text: {
          fr: "Elle se mesure en millimètres (mm), c'est la fameuse « colonne d'eau ». Visez au minimum 2 000 mm pour le double-toit et 3 000 mm pour le tapis de sol. Pourquoi plus pour le sol ? Parce que votre poids, en position couchée, écrase le tissu contre une flaque éventuelle et fait remonter l'eau par le bas — un sol sous-dimensionné est la cause n°1 des nuits humides.",
          ar: "تُقاس بالميليمتر (mm)، وهي ما يُعرف بـ«عمود الماء». استهدف 2000 mm على الأقل للسقف المزدوج و3000 mm لأرضية الخيمة. ولماذا أكثر للأرضية؟ لأن وزنك في وضع الاستلقاء يضغط القماش على بركة محتملة فيصعد الماء من الأسفل — والأرضية ضعيفة العزل هي السبب الأول لليالي الرطبة.",
        },
      },
      {
        type: "p",
        text: {
          fr: "Au-delà des chiffres, soignez les coutures : des coutures thermosoudées (étanchéifiées en usine) valent mieux qu'une colonne d'eau élevée mais des coutures qui fuient. Un double-toit qui descend bien jusqu'au sol protège aussi mieux des pluies battantes et des éclaboussures.",
          ar: "إلى جانب الأرقام، اهتمّ بالخياطات: الخياطات المُلحَّمة حراريًا (المعزولة في المصنع) أفضل من عمود ماء عالٍ مع خياطات تسرّب الماء. كما أن السقف المزدوج الذي ينزل جيّدًا حتى الأرض يحمي أكثر من الأمطار الغزيرة والرذاذ.",
        },
      },
      {
        type: "h2",
        text: { fr: "4. Poids, montage et budget", ar: "4. الوزن والتركيب والميزانية" },
      },
      {
        type: "p",
        text: {
          fr: "Pour camper près de la voiture, le poids importe peu : privilégiez l'espace, la hauteur et la facilité de montage. Pour la randonnée, chaque gramme compte et l'on cherche le meilleur rapport poids/protection. Côté budget, mieux vaut une tente d'entrée de gamme bien imperméable et bien entretenue qu'un modèle « 4 saisons » négligé : l'entretien compte autant que le prix d'achat.",
          ar: "للتخييم قرب السيارة، الوزن غير مهم: فضّل المساحة والارتفاع وسهولة التركيب. أما للمشي الجبلي، فكل غرام مهم وتبحث عن أفضل نسبة وزن/حماية. ومن حيث الميزانية، خيمة اقتصادية جيدة العزل وحسنة الصيانة أفضل من نموذج «4 مواسم» مُهمَل: فالصيانة تهمّ بقدر سعر الشراء.",
        },
      },
      {
        type: "h2",
        text: { fr: "5. Le montage et la ventilation", ar: "5. التركيب والتهوية" },
      },
      {
        type: "p",
        text: {
          fr: "Une tente facile à monter vous fait gagner un temps précieux à l'arrivée, surtout sous la pluie ou de nuit. Les modèles pop-up se déploient en un geste mais se rangent encombrants ; les tentes à arceaux demandent quelques minutes mais se compactent mieux. Surtout, privilégiez une tente double-paroi (chambre intérieure + double-toit) : la double-paroi limite la condensation, cette humidité qui se dépose à l'intérieur au petit matin. Des aérations en haut et en bas font circuler l'air et gardent la chambre sèche.",
          ar: "الخيمة سهلة التركيب تربحك وقتًا ثمينًا عند الوصول، خاصة تحت المطر أو ليلًا. النماذج «البوب-أب» تنفتح بحركة واحدة لكنها كبيرة الحجم عند الطيّ؛ والخيام ذات القضبان تحتاج بضع دقائق لكنها أصغر حجمًا. والأهم، فضّل خيمة مزدوجة الجدار (غرفة داخلية + سقف مزدوج): فالجدار المزدوج يحدّ من التكاثف، تلك الرطوبة التي تترسّب بالداخل عند الفجر. وفتحات التهوية في الأعلى والأسفل تحرّك الهواء وتبقي الغرفة جافة.",
        },
      },
      {
        type: "h2",
        text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" },
      },
      {
        type: "ul",
        items: [
          { fr: "Choisir la tente au nombre de places exact, sans marge : on se retrouve à dormir collés, sacs dehors.", ar: "اختيار الخيمة بعدد الأماكن المضبوط دون هامش: فتنام ملتصقًا والحقائب بالخارج." },
          { fr: "Négliger la colonne d'eau du sol : l'eau remonte par le bas, pas seulement par le toit.", ar: "إهمال عمود ماء الأرضية: فالماء يصعد من الأسفل، وليس من السقف فقط." },
          { fr: "Ranger la tente humide : elle moisit et perd son imperméabilité. Faites-la toujours sécher au retour.", ar: "طيّ الخيمة وهي مبلّلة: فتتعفّن وتفقد عزلها. جفّفها دائمًا عند العودة." },
          { fr: "Ne pas tester le montage à la maison avant la première sortie.", ar: "عدم تجربة التركيب في البيت قبل أول خرجة." },
          { fr: "Oublier des sardines solides : sur sol dur ou venteux, les piquets d'origine plient vite.", ar: "نسيان أوتاد متينة: على أرض صلبة أو في الرياح، تنحني الأوتاد الأصلية بسرعة." },
        ],
      },
      {
        type: "h2",
        text: { fr: "L'essentiel à retenir", ar: "الخلاصة" },
      },
      {
        type: "p",
        text: {
          fr: "Partez de votre usage réel : combien vous êtes, en quelle saison, et comment vous transportez la tente. Pour la grande majorité des sorties en Algérie, une tente 3 saisons, « 3 places » pour deux campeurs, avec environ 2 000 mm au toit et 3 000 mm au sol et des coutures thermosoudées, est le choix sûr. Le reste — poids, montage rapide, abside, hauteur — se règle selon le confort que vous recherchez et votre budget.",
          ar: "انطلق من استعمالك الحقيقي: كم أنتم، في أي موسم، وكيف تنقل الخيمة. لأغلب الخرجات في الجزائر، خيمة 3 مواسم، «3 أماكن» لمخيّمَين، بحوالي 2000 mm للسقف و3000 mm للأرضية وخياطات ملحّمة حراريًا، هي الخيار الآمن. والباقي — الوزن، التركيب السريع، الرواق، الارتفاع — يُضبط حسب الراحة التي تريدها وميزانيتك.",
        },
      },
    ],
    faq: [
      {
        q: {
          fr: "Comment éviter la condensation dans la tente ?",
          ar: "كيف أتجنّب التكاثف داخل الخيمة؟",
        },
        a: {
          fr: "Choisissez une tente double-paroi et laissez les aérations ouvertes la nuit. Évitez de tout fermer hermétiquement : un peu d'air qui circule évacue l'humidité de la respiration et empêche les gouttes de se former à l'intérieur.",
          ar: "اختر خيمة مزدوجة الجدار واترك فتحات التهوية مفتوحة ليلًا. تجنّب إغلاق كل شيء بإحكام: فقليل من الهواء المتحرّك يطرد رطوبة التنفّس ويمنع تكوّن القطرات بالداخل.",
        },
      },
      {
        q: {
          fr: "Comment entretenir sa tente pour qu'elle dure ?",
          ar: "كيف أعتني بخيمتي لتدوم؟",
        },
        a: {
          fr: "Faites-la toujours sécher complètement avant de la ranger, nettoyez-la à l'eau claire (jamais de détergent agressif), et réimperméabilisez le double-toit lorsque l'eau cesse de perler à sa surface.",
          ar: "جفّفها تمامًا قبل طيّها، نظّفها بماء صافٍ (دون منظّف قوي أبدًا)، وأعد عزل السقف المزدوج عندما يتوقّف الماء عن التحبّب على سطحه.",
        },
      },
      {
        q: {
          fr: "Quelle taille de tente pour 2 personnes ?",
          ar: "ما حجم الخيمة المناسب لشخصين؟",
        },
        a: {
          fr: "Une tente 3 places offre le meilleur confort pour 2 adultes : vous logez les sacs à l'intérieur et gardez de l'espace pour bouger.",
          ar: "خيمة بسعة 3 أماكن توفّر أفضل راحة لشخصين بالغين: تضع الحقائب بالداخل وتحتفظ بمساحة للحركة.",
        },
      },
      {
        q: {
          fr: "Quelle imperméabilité minimale choisir ?",
          ar: "ما الحد الأدنى لمقاومة الماء؟",
        },
        a: {
          fr: "Au moins 2 000 mm de colonne d'eau pour le toit et 3 000 mm pour le sol. C'est suffisant pour la pluie soutenue.",
          ar: "على الأقل 2000 mm عمود ماء للسقف و3000 mm للأرضية. وهذا كافٍ للمطر المستمر.",
        },
      },
    ],
  },
  {
    slug: "choisir-sac-de-couchage",
    title: {
      fr: "Bien choisir son sac de couchage",
      ar: "كيف تختار كيس النوم المناسب",
    },
    description: {
      fr: "Température de confort, garnissage duvet ou synthétique, forme sarcophage : comment choisir un sac de couchage adapté à vos nuits en extérieur.",
      ar: "درجة حرارة الراحة، الحشو ريشي أم صناعي، الشكل المومياء: كيف تختار كيس نوم مناسبًا لليالي في الهواء الطلق.",
    },
    excerpt: {
      fr: "Températures, garnissage et forme : les clés pour ne plus jamais avoir froid la nuit.",
      ar: "درجات الحرارة، الحشو والشكل: مفاتيح كي لا تشعر بالبرد ليلًا مجددًا.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 8,
    relatedCategories: ["sacs-de-couchage"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "Un bon sac de couchage, c'est la différence entre une nuit réparatrice et une nuit blanche passée à grelotter — et le lendemain, entre une journée pleine d'énergie et une rando subie. Beaucoup de campeurs sous-estiment ce point : même en été, les nuits en altitude descendent facilement sous 10 °C en Algérie. La bonne nouvelle, c'est que trois critères suffisent pour bien choisir : la température, le garnissage et la forme. Ce guide les détaille, puis ajoute les accessoires et les erreurs à connaître pour ne plus jamais avoir froid la nuit.",
          ar: "كيس النوم الجيّد هو الفرق بين ليلة مريحة وليلة بيضاء تُقضى في الارتجاف بردًا — وفي الغد، بين يوم مفعم بالطاقة ومشيٍ مُتعِب. كثير من المخيّمين يستهينون بهذا: فحتى في الصيف، تنخفض الليالي في المرتفعات بسهولة تحت 10 °م في الجزائر. والخبر الجيّد أن ثلاثة معايير تكفي للاختيار الصحيح: درجة الحرارة، الحشو، والشكل. يفصّلها هذا الدليل، ثم يضيف الملحقات والأخطاء التي ينبغي معرفتها كي لا تشعر بالبرد ليلًا مجددًا.",
        },
      },
      {
        type: "h2",
        text: { fr: "1. Les températures de confort", ar: "1. درجات حرارة الراحة" },
      },
      {
        type: "p",
        text: {
          fr: "Chaque sac affiche trois valeurs : confort (la plus importante), limite, et extrême (une valeur de survie, à ne jamais viser). Fiez-vous à la température de confort et prenez une marge de sécurité de 5 °C par rapport aux nuits les plus froides que vous prévoyez.",
          ar: "كل كيس يعرض ثلاث قيم: الراحة (الأهم)، الحد، والقصوى (قيمة نجاة، لا تستهدفها أبدًا). اعتمد على درجة حرارة الراحة وخذ هامش أمان 5 °م مقارنة بأبرد الليالي المتوقعة.",
        },
      },
      {
        type: "p",
        text: {
          fr: "Ces valeurs restent indicatives : la sensation de froid dépend aussi de vous. Les femmes et les personnes qui dorment « frileux » gagnent à prendre une marge supplémentaire, tout comme ceux qui campent fatigués ou peu nourris. Un sac trop chaud n'est pas un problème : on l'ouvre. Un sac trop juste, lui, transforme la nuit en épreuve.",
          ar: "تبقى هذه القيم استرشادية: فالإحساس بالبرد يعتمد عليك أيضًا. النساء ومن ينامون «بحساسية للبرد» يستفيدون من هامش إضافي، وكذلك من يخيّمون مُتعبين أو قليلي التغذية. الكيس الدافئ أكثر من اللازم ليس مشكلة: تفتحه. أما الكيس الضيّق في حرارته فيحوّل الليلة إلى محنة.",
        },
      },
      {
        type: "h2",
        text: { fr: "2. Le garnissage : duvet ou synthétique ?", ar: "2. الحشو: ريشي أم صناعي؟" },
      },
      {
        type: "ul",
        items: [
          {
            fr: "Duvet : très chaud, léger et compressible, mais plus cher et craint l'humidité. Idéal en montagne sèche.",
            ar: "الريشي: دافئ جدًا، خفيف وقابل للضغط، لكنه أغلى ويتأثر بالرطوبة. مثالي في الجبال الجافة.",
          },
          {
            fr: "Synthétique : moins cher, garde la chaleur même humide, sèche vite. Plus volumineux. Parfait pour débuter.",
            ar: "الصناعي: أرخص، يحافظ على الدفء حتى مبلولًا، ويجف بسرعة. أكبر حجمًا. مثالي للمبتدئين.",
          },
        ],
      },
      {
        type: "h2",
        text: { fr: "3. La forme et les détails qui comptent", ar: "3. الشكل والتفاصيل المهمة" },
      },
      {
        type: "p",
        text: {
          fr: "La forme sarcophage (momie) enserre le corps et limite les pertes de chaleur : c'est la plus efficace, et la plus légère. La forme couverture (rectangulaire) est plus spacieuse et agréable l'été, mais moins chaude. Dans tous les cas, vérifiez la présence d'une capuche ajustable et d'un rabat anti-froid (boudin de tissu) le long de la fermeture éclair : c'est par là que s'échappe une bonne partie de la chaleur.",
          ar: "الشكل المومياء يحتضن الجسم ويقلّل فقدان الحرارة: وهو الأكثر فعالية والأخفّ. أما الشكل البطّانية (المستطيل) فأوسع وألطف صيفًا، لكنه أقل دفئًا. وفي كل الأحوال، تحقّق من وجود قلنسوة قابلة للضبط وحاجز ضد البرد (شريط قماشي) على طول السحّاب: فمن هناك يتسرّب جزء كبير من الحرارة.",
        },
      },
      {
        type: "h2",
        text: { fr: "4. L'accessoire qui change tout : le matelas", ar: "4. الملحق الذي يغيّر كل شيء: الفرشة" },
      },
      {
        type: "p",
        text: {
          fr: "On l'oublie souvent, mais un sac de couchage ne chauffe pas tout seul : il piège la chaleur que votre corps produit. Or, allongé, vous écrasez le garnissage sous vous, qui ne vous isole plus du sol. C'est le matelas — et son pouvoir isolant (valeur « R ») — qui fait le travail par en dessous. Un excellent sac sur un sol nu laissera passer le froid. Pensez aussi à un drap de sac : il gagne quelques degrés et garde le sac propre plus longtemps.",
          ar: "كثيرًا ما نغفل عنه، لكن كيس النوم لا يُدفئ بنفسه: بل يحبس الحرارة التي ينتجها جسمك. وعند الاستلقاء تضغط الحشو تحتك فلا يعزلك عن الأرض. والفرشة — وقدرتها العازلة (قيمة «R») — هي التي تقوم بالمهمّة من الأسفل. فأفضل كيس على أرض عارية يترك البرد يمرّ. فكّر أيضًا في غطاء داخلي للكيس: يكسبك بضع درجات ويبقي الكيس نظيفًا أطول.",
        },
      },
      {
        type: "h2",
        text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" },
      },
      {
        type: "ul",
        items: [
          { fr: "Se fier à la température « extrême » : c'est une valeur de survie, pas de confort.", ar: "الاعتماد على درجة الحرارة «القصوى»: فهي قيمة نجاة وليست راحة." },
          { fr: "Dormir directement sur le sol sans matelas isolant : on a froid même avec un bon sac.", ar: "النوم مباشرة على الأرض دون فرشة عازلة: تشعر بالبرد حتى مع كيس جيّد." },
          { fr: "Stocker le sac compressé toute l'année : le garnissage s'écrase et perd son gonflant. Rangez-le déroulé ou dans un grand sac aéré.", ar: "تخزين الكيس مضغوطًا طوال السنة: ينضغط الحشو ويفقد انتفاخه. خزّنه مفرودًا أو في كيس كبير مهوّى." },
          { fr: "Entrer transpirant ou avec des vêtements humides : l'humidité tue le pouvoir chauffant.", ar: "الدخول متعرّقًا أو بملابس مبلّلة: الرطوبة تقتل قدرة التدفئة." },
        ],
      },
      {
        type: "h2",
        text: { fr: "L'essentiel à retenir", ar: "الخلاصة" },
      },
      {
        type: "p",
        text: {
          fr: "Choisissez d'abord la température de confort avec 5 °C de marge, puis le garnissage selon votre usage (synthétique pour débuter et l'humidité, duvet pour le froid sec et la légèreté), et enfin la forme sarcophage pour un maximum d'efficacité. Et n'oubliez jamais le duo gagnant : un bon sac ne vaut que posé sur un bon matelas isolant.",
          ar: "اختر أولًا درجة حرارة الراحة بهامش 5 °م، ثم الحشو حسب استعمالك (صناعي للبداية وللرطوبة، ريشي للبرد الجاف وخفّة الوزن)، وأخيرًا الشكل المومياء لأقصى فعالية. ولا تنسَ أبدًا الثنائي الرابح: الكيس الجيّد لا قيمة له إلا فوق فرشة عازلة جيّدة.",
        },
      },
    ],
    faq: [
      {
        q: {
          fr: "Comment laver et entretenir son sac de couchage ?",
          ar: "كيف أغسل كيس النوم وأعتني به؟",
        },
        a: {
          fr: "Lavez-le rarement, à la main ou en machine sur cycle délicat à froid, avec une lessive adaptée (spéciale duvet si c'est du duvet). Séchez-le complètement et stockez-le déroulé, jamais compressé : c'est ce qui préserve le gonflant et la chaleur dans le temps.",
          ar: "اغسله نادرًا، يدويًا أو في الغسالة على دورة لطيفة باردة، بمنظّف مناسب (خاص بالريش إن كان ريشيًا). جفّفه تمامًا وخزّنه مفرودًا، لا مضغوطًا أبدًا: فهذا ما يحافظ على الانتفاخ والدفء مع الوقت.",
        },
      },
      {
        q: {
          fr: "Faut-il un matelas avec le sac de couchage ?",
          ar: "هل أحتاج فرشة مع كيس النوم؟",
        },
        a: {
          fr: "Oui, c'est indispensable. Le matelas vous isole du sol qui aspire la chaleur du corps. Sans lui, même le meilleur sac vous laissera froid par en dessous.",
          ar: "نعم، إنه ضروري. الفرشة تعزلك عن الأرض التي تسحب حرارة الجسم. وبدونها، حتى أفضل كيس سيتركك باردًا من الأسفل.",
        },
      },
      {
        q: {
          fr: "Duvet ou synthétique pour débuter ?",
          ar: "ريشي أم صناعي للمبتدئين؟",
        },
        a: {
          fr: "Le synthétique : moins cher, plus tolérant à l'humidité et plus facile d'entretien. Le duvet devient intéressant pour le froid sec et la légèreté.",
          ar: "الصناعي: أرخص، أكثر تحمّلًا للرطوبة وأسهل صيانة. أما الريشي فيصبح مفيدًا للبرد الجاف وخفّة الوزن.",
        },
      },
      {
        q: {
          fr: "Quelle température de confort choisir ?",
          ar: "ما درجة حرارة الراحة التي أختارها؟",
        },
        a: {
          fr: "Prenez une marge de sécurité de 5 °C sous la température la plus basse attendue, et fiez-vous à la valeur « confort », pas à la valeur « extrême ».",
          ar: "خذ هامش أمان 5 °م تحت أدنى درجة حرارة متوقعة، واعتمد على قيمة «الراحة» وليس قيمة «القصوى».",
        },
      },
    ],
  },
  {
    slug: "checklist-materiel-camping",
    title: {
      fr: "Liste de matériel de camping : la checklist complète",
      ar: "قائمة معدات التخييم: قائمة التحقق الكاملة",
    },
    description: {
      fr: "La checklist complète pour ne rien oublier : couchage, abri, cuisine, vêtements, eau et sécurité. Le matériel essentiel pour partir camper l'esprit tranquille.",
      ar: "قائمة التحقق الكاملة كي لا تنسى شيئًا: النوم، المأوى، الطبخ، الملابس، الماء والسلامة. المعدات الأساسية للتخييم براحة بال.",
    },
    excerpt: {
      fr: "Couchage, abri, cuisine, vêtements, sécurité : la liste pour ne rien oublier avant de partir.",
      ar: "النوم، المأوى، الطبخ، الملابس، السلامة: القائمة كي لا تنسى شيئًا قبل الانطلاق.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 9,
    relatedCategories: ["tentes-abris", "sacs-de-couchage", "cuisine-outdoor"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "Rien ne gâche une sortie comme un oubli : la lampe restée à la maison, le briquet introuvable, ou la petite laine manquante quand la température chute la nuit. Une bonne checklist transforme la préparation en routine et vous évite les mauvaises surprises. Voici la liste complète, organisée par poste, pour un week-end de camping à deux ou en famille. Adaptez les quantités à la durée et à la saison.",
          ar: "لا شيء يفسد الخرجة مثل النسيان: المصباح الذي بقي في البيت، الولاعة المفقودة، أو السترة الصغيرة الناقصة حين تنخفض الحرارة ليلًا. قائمة التحقق الجيدة تحوّل التحضير إلى عادة وتجنّبك المفاجآت السيّئة. إليك القائمة الكاملة، مرتّبة حسب الفئة، لعطلة تخييم لشخصين أو للعائلة. عدّل الكميات حسب المدة والموسم.",
        },
      },
      { type: "h2", text: { fr: "Le couchage", ar: "النوم" } },
      {
        type: "ul",
        items: [
          { fr: "Tente adaptée au nombre de personnes (prenez une place de plus pour le confort)", ar: "خيمة مناسبة لعدد الأشخاص (خذ مكانًا إضافيًا من أجل الراحة)" },
          { fr: "Sac de couchage avec une température de confort adaptée à la saison", ar: "كيس نوم بدرجة حرارة راحة مناسبة للموسم" },
          { fr: "Matelas de sol ou tapis isolant — c'est lui qui vous coupe du froid du sol", ar: "فرشة أرضية أو حصيرة عازلة — هي التي تعزلك عن برودة الأرض" },
          { fr: "Oreiller gonflable ou compressible (un vêtement roulé fait l'affaire)", ar: "وسادة قابلة للنفخ أو الضغط (قطعة ملابس ملفوفة تفي بالغرض)" },
        ],
      },
      { type: "h2", text: { fr: "L'abri et le campement", ar: "المأوى والمخيم" } },
      {
        type: "p",
        text: {
          fr: "Au-delà de la tente, quelques accessoires font toute la différence pour un campement stable et confortable, surtout sur sol dur ou venteux.",
          ar: "إلى جانب الخيمة، بعض الملحقات تصنع الفرق لمخيم ثابت ومريح، خاصة على أرض صلبة أو في الرياح.",
        },
      },
      {
        type: "ul",
        items: [
          { fr: "Sardines (piquets) supplémentaires et un maillet léger", ar: "أوتاد إضافية ومطرقة خفيفة" },
          { fr: "Bâche de sol (footprint) pour protéger le tapis de la tente", ar: "غطاء أرضي لحماية أرضية الخيمة" },
          { fr: "Corde et tendeurs pour sécuriser la tente par grand vent", ar: "حبل ومشدّات لتثبيت الخيمة عند اشتداد الرياح" },
          { fr: "Tarp ou auvent pour créer un coin d'ombre ou s'abriter de la pluie", ar: "مظلّة أو سقيفة لإنشاء ركن ظل أو الاحتماء من المطر" },
        ],
      },
      { type: "h2", text: { fr: "La cuisine", ar: "الطبخ" } },
      {
        type: "ul",
        items: [
          { fr: "Réchaud + cartouche de gaz (vérifiez le niveau avant de partir)", ar: "موقد + قارورة غاز (تحقّق من المستوى قبل الانطلاق)" },
          { fr: "Briquet ET allumettes étanches (toujours une solution de secours)", ar: "ولاعة وأعواد ثقاب مقاومة للماء (دائمًا حل احتياطي)" },
          { fr: "Popote (casserole), couverts, couteau pliant, planche légère", ar: "أواني طبخ، أدوات مائدة، سكين قابل للطي، لوح خفيف" },
          { fr: "Gourde et/ou bidon d'eau, éponge et liquide vaisselle biodégradable", ar: "قارورة و/أو خزان ماء، إسفنجة وسائل غسيل قابل للتحلل" },
          { fr: "Glacière ou sac isotherme pour les denrées fraîches", ar: "ثلاجة محمولة أو حقيبة عازلة للمواد الطازجة" },
        ],
      },
      { type: "h2", text: { fr: "Les vêtements (la règle des 3 couches)", ar: "الملابس (قاعدة الطبقات الثلاث)" } },
      {
        type: "p",
        text: {
          fr: "Même en été, les nuits en altitude sont fraîches en Algérie. Habillez-vous en trois couches : une première couche qui évacue la transpiration, une couche chaude (polaire ou doudoune), et une couche extérieure coupe-vent et imperméable. Vous ajustez ainsi facilement selon la météo.",
          ar: "حتى في الصيف، الليالي في المرتفعات باردة في الجزائر. ارتدِ ثلاث طبقات: طبقة أولى تطرد العرق، طبقة دافئة (صوف أو سترة منفوخة)، وطبقة خارجية صادّة للرياح ومقاومة للماء. هكذا تتكيّف بسهولة حسب الطقس.",
        },
      },
      { type: "h2", text: { fr: "Eau, hygiène et sécurité", ar: "الماء والنظافة والسلامة" } },
      {
        type: "ul",
        items: [
          { fr: "Réserve d'eau suffisante : comptez environ 3 litres par personne et par jour (boisson + cuisine)", ar: "احتياطي ماء كافٍ: احسب حوالي 3 لترات للشخص في اليوم (شرب + طبخ)" },
          { fr: "Trousse de premiers secours : pansements, désinfectant, antalgique, anti-moustique", ar: "علبة إسعافات أولية: ضمادات، مطهّر، مسكّن، طارد للبعوض" },
          { fr: "Lampe frontale + piles de rechange (ou batterie chargée)", ar: "مصباح أمامي + بطاريات احتياطية (أو بطارية مشحونة)" },
          { fr: "Téléphone chargé, batterie externe, et la position du campement notée hors-ligne", ar: "هاتف مشحون، بطارية خارجية، وموقع المخيم مدوّن دون اتصال" },
          { fr: "Sacs poubelle : on repart toujours avec tous ses déchets", ar: "أكياس قمامة: نغادر دائمًا بكل نفاياتنا" },
        ],
      },
      { type: "h2", text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" } },
      {
        type: "ul",
        items: [
          { fr: "Préparer sa liste à la dernière minute : dans la précipitation, on oublie toujours quelque chose.", ar: "تحضير القائمة في آخر لحظة: في العجلة، ننسى دائمًا شيئًا ما." },
          { fr: "Surcharger « au cas où » : un sac trop lourd fatigue et gâche la sortie. Listez l'essentiel, pas le superflu.", ar: "الإفراط في الحمل «تحسّبًا»: الحقيبة الثقيلة تُتعب وتفسد الخرجة. اكتب الأساسي، لا الزائد." },
          { fr: "Oublier les piles/batteries de rechange et un moyen de faire du feu de secours.", ar: "نسيان البطاريات الاحتياطية ووسيلة لإشعال نار احتياطية." },
          { fr: "Négliger la trousse de premiers secours et la protection solaire (crème, casquette).", ar: "إهمال علبة الإسعافات الأولية والوقاية من الشمس (كريم، قبّعة)." },
        ],
      },
      { type: "h2", text: { fr: "L'essentiel à retenir", ar: "الخلاصة" } },
      {
        type: "p",
        text: {
          fr: "Une bonne checklist se prépare à tête reposée, quelques jours avant, et se coche au moment de charger. Gardez en tête les quatre piliers — dormir au chaud, s'abriter, manger et boire, voir et se soigner — et vous ne laisserez jamais rien d'important derrière vous. Adaptez ensuite les quantités à la durée, à la saison et au nombre de campeurs.",
          ar: "قائمة التحقق الجيّدة تُحضَّر بذهن صافٍ قبل أيام، وتُؤشَّر عند التحميل. احتفظ بالركائز الأربع في ذهنك — النوم بدفء، المأوى، الأكل والشرب، الرؤية والإسعاف — ولن تترك خلفك شيئًا مهمًّا أبدًا. ثم عدّل الكميات حسب المدة والموسم وعدد المخيّمين.",
        },
      },
    ],
    faq: [
      {
        q: { fr: "Comment éviter de surcharger son sac ?", ar: "كيف أتجنّب إثقال حقيبتي؟" },
        a: { fr: "Partez de la liste essentielle et pesez chaque « au cas où ». Mutualisez le matériel à plusieurs (une seule tente, un seul réchaud, une seule trousse de secours) et privilégiez les objets multi-usages.", ar: "انطلق من القائمة الأساسية وزِن كل «تحسّبًا». تقاسموا المعدات ضمن المجموعة (خيمة واحدة، موقد واحد، علبة إسعافات واحدة) وفضّل الأغراض متعدّدة الاستعمال." },
      },
      {
        q: { fr: "Combien d'eau prévoir par personne ?", ar: "كم من الماء أحضّر للشخص؟" },
        a: { fr: "Comptez environ 3 litres par personne et par jour en incluant la cuisine, davantage par forte chaleur ou si aucun point d'eau n'est accessible sur place.", ar: "احسب حوالي 3 لترات للشخص في اليوم شاملةً الطبخ، وأكثر في الحر الشديد أو إذا لم يتوفّر مصدر ماء في المكان." },
      },
      {
        q: { fr: "Que faut-il absolument ne pas oublier ?", ar: "ما الذي يجب ألّا أنساه إطلاقًا؟" },
        a: { fr: "Les trois indispensables : de quoi dormir au chaud (sac + matelas isolant), de quoi s'éclairer (lampe frontale + piles), et de quoi faire du feu (briquet + allumettes de secours).", ar: "الثلاثة الأساسية: ما يبقيك دافئًا للنوم (كيس + فرشة عازلة)، ما يضيء لك (مصباح أمامي + بطاريات)، وما يشعل النار (ولاعة + ثقاب احتياطي)." },
      },
      {
        q: { fr: "Faut-il un matelas même en été ?", ar: "هل أحتاج فرشة حتى في الصيف؟" },
        a: { fr: "Oui. Le matelas ne sert pas qu'au confort : il vous isole du sol qui pompe la chaleur du corps la nuit, même quand l'air est doux.", ar: "نعم. الفرشة ليست للراحة فقط: فهي تعزلك عن الأرض التي تسحب حرارة الجسم ليلًا، حتى عندما يكون الهواء معتدلًا." },
      },
    ],
  },
  {
    slug: "bivouac-en-algerie",
    title: {
      fr: "Bivouac en Algérie : le guide du débutant",
      ar: "المبيت في الطبيعة بالجزائر: دليل المبتدئين",
    },
    description: {
      fr: "Où bivouaquer en Algérie, à quelle saison, et comment le faire dans le respect des lieux. Régions, sécurité et bonnes pratiques pour une première nuit en pleine nature.",
      ar: "أين تبيت في الطبيعة بالجزائر، في أي موسم، وكيف تفعل ذلك باحترام المكان. المناطق والسلامة والممارسات الجيدة لأول ليلة في الطبيعة.",
    },
    excerpt: {
      fr: "Régions, saisons, sécurité et respect des lieux : tout pour réussir sa première nuit à la belle étoile.",
      ar: "المناطق، المواسم، السلامة واحترام المكان: كل ما يلزم لنجاح أول ليلة تحت النجوم.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 8,
    relatedCategories: ["tentes-abris", "sacs-de-couchage"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "Le bivouac, c'est l'art de passer une nuit en pleine nature avec un campement léger, monté le soir et démonté au matin. L'Algérie offre des décors parmi les plus variés du bassin méditerranéen : forêts de cèdres, hauts plateaux, montagnes kabyles et immensités sahariennes. Voici comment faire ses premiers pas sereinement.",
          ar: "المبيت في الطبيعة هو فنّ قضاء ليلة في الطبيعة بمخيم خفيف، يُنصب مساءً ويُفكّك صباحًا. تقدّم الجزائر مناظر من بين الأكثر تنوّعًا في الحوض المتوسطي: غابات الأرز، الهضاب العليا، جبال القبائل والامتدادات الصحراوية. إليك كيف تخطو خطواتك الأولى باطمئنان.",
        },
      },
      { type: "h2", text: { fr: "Où bivouaquer ?", ar: "أين تبيت؟" } },
      {
        type: "ul",
        items: [
          { fr: "La montagne kabyle (Djurdjura, Tikjda) : air frais, lacs et sommets, idéale du printemps à l'automne", ar: "جبال القبائل (جرجرة، تيكجدة): هواء منعش، بحيرات وقمم، مثالية من الربيع إلى الخريف" },
          { fr: "Les forêts de cèdres (Chréa, Théniet El Had, Belezma) : ombre, fraîcheur et sentiers balisés", ar: "غابات الأرز (الشريعة، ثنية الحد، بلزمة): ظل وانتعاش ومسالك معلّمة" },
          { fr: "Le littoral et les criques : pour un bivouac doux hors saison estivale", ar: "الساحل والخلجان: لمبيت لطيف خارج موسم الصيف" },
          { fr: "Le Sahara (Tassili n'Ajjer, Hoggar) : magique, mais exigeant — privilégiez un accompagnement local", ar: "الصحراء (طاسيلي ناجر، الهقار): ساحرة، لكنها متطلّبة — فضّل مرافقة محلية" },
        ],
      },
      { type: "h2", text: { fr: "À quelle saison partir ?", ar: "في أي موسم تذهب؟" } },
      {
        type: "p",
        text: {
          fr: "En montagne et en forêt, la fenêtre idéale va d'avril à octobre : journées agréables, nuits fraîches mais supportables avec un bon sac de couchage. Au Sahara, c'est l'inverse : on évite l'été et on privilégie d'octobre à mars, quand les journées sont douces et les nuits froides. Vérifiez toujours la météo locale et l'enneigement en altitude avant de partir.",
          ar: "في الجبال والغابات، النافذة المثالية من أفريل إلى أكتوبر: أيام لطيفة، ليالٍ باردة لكن محتملة مع كيس نوم جيّد. أما في الصحراء فالعكس: نتجنّب الصيف ونفضّل من أكتوبر إلى مارس، حين تكون الأيام معتدلة والليالي باردة. تحقّق دائمًا من الطقس المحلي ومن الثلوج في المرتفعات قبل الانطلاق.",
        },
      },
      { type: "h2", text: { fr: "Sécurité : les réflexes essentiels", ar: "السلامة: ردود الفعل الأساسية" } },
      {
        type: "ul",
        items: [
          { fr: "Prévenez un proche de votre itinéraire et de l'heure de retour prévue", ar: "أخبر شخصًا قريبًا بمسارك وبموعد العودة المتوقّع" },
          { fr: "Ne partez jamais seul pour une première fois ; restez à plusieurs", ar: "لا تذهب وحدك في أول مرة؛ ابقَ ضمن مجموعة" },
          { fr: "Emportez plus d'eau que prévu et de quoi vous orienter hors-ligne", ar: "احمل ماءً أكثر من المتوقّع وما يساعدك على التوجّه دون اتصال" },
          { fr: "Montez le camp avant la tombée de la nuit, sur un sol plat et à l'écart des lits d'oued", ar: "انصب المخيم قبل حلول الظلام، على أرض مستوية وبعيدًا عن مجاري الأودية" },
        ],
      },
      { type: "h2", text: { fr: "Respecter les lieux (Leave No Trace)", ar: "احترام المكان (لا تترك أثرًا)" } },
      {
        type: "p",
        text: {
          fr: "Un beau site le reste si chacun en prend soin. Remportez l'intégralité de vos déchets, n'allumez de feu que si c'est autorisé et sans risque, restez sur les sentiers, et gardez vos distances avec la faune et les troupeaux. On laisse l'endroit aussi propre — ou plus propre — qu'on l'a trouvé.",
          ar: "يبقى المكان الجميل جميلًا إذا اعتنى به الجميع. خذ كل نفاياتك معك، لا تشعل النار إلا إذا كان مسموحًا وآمنًا، ابقَ على المسالك، وحافظ على مسافة من الحيوانات والقطعان. نترك المكان نظيفًا — أو أنظف — مما وجدناه.",
        },
      },
      { type: "h2", text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" } },
      {
        type: "ul",
        items: [
          { fr: "Partir sans vérifier la météo et, en montagne, l'enneigement en altitude.", ar: "الانطلاق دون التحقّق من الطقس، وفي الجبل من الثلوج في المرتفعات." },
          { fr: "Monter le camp trop tard, dans le noir, sur un emplacement mal choisi.", ar: "نصب المخيم متأخرًا، في الظلام، على مكان سيّئ الاختيار." },
          { fr: "Sous-estimer l'eau : il n'y a pas toujours de source praticable sur place.", ar: "الاستهانة بالماء: لا يتوفّر دائمًا مصدر صالح في المكان." },
          { fr: "Faire du feu sans précaution, ou en période de risque d'incendie où il est interdit.", ar: "إشعال النار دون احتياط، أو في فترات خطر الحرائق حيث يُمنع ذلك." },
        ],
      },
      { type: "h2", text: { fr: "L'essentiel à retenir", ar: "الخلاصة" } },
      {
        type: "p",
        text: {
          fr: "Un bivouac réussi tient en trois mots : préparation, prudence, respect. On choisit une saison adaptée à la région, on prévient un proche de son itinéraire, on emporte large en eau, et on laisse le site impeccable. Pour le Grand Sud saharien, un accompagnement local n'est pas un luxe mais une sécurité — et la garantie de profiter pleinement de paysages parmi les plus beaux du monde.",
          ar: "المبيت الناجح يختصر في ثلاث كلمات: التحضير، الحذر، الاحترام. تختار موسمًا مناسبًا للمنطقة، تُخبر شخصًا قريبًا بمسارك، تحمل ماءً وافرًا، وتترك المكان نظيفًا تمامًا. وفي الجنوب الكبير الصحراوي، المرافقة المحلية ليست رفاهية بل أمانًا — وضمانًا للاستمتاع الكامل بمناظر من بين الأجمل في العالم.",
        },
      },
    ],
    faq: [
      {
        q: { fr: "Quelle est la meilleure période pour bivouaquer en montagne ?", ar: "ما أفضل فترة للمبيت في الجبل؟" },
        a: { fr: "D'avril à octobre : journées agréables et nuits fraîches mais gérables avec un bon sac de couchage. Évitez la haute altitude en hiver si vous n'avez pas d'expérience de la neige et du froid extrême.", ar: "من أفريل إلى أكتوبر: أيام لطيفة وليالٍ باردة لكن محتملة مع كيس نوم جيّد. تجنّب المرتفعات العالية شتاءً إن لم تكن لديك خبرة بالثلج والبرد الشديد." },
      },
      {
        q: { fr: "Le bivouac est-il autorisé en Algérie ?", ar: "هل المبيت في الطبيعة مسموح في الجزائر؟" },
        a: { fr: "Le bivouac de courte durée est généralement toléré en pleine nature, mais certaines zones (parcs, sites protégés, abords militaires) sont réglementées. Renseignez-vous localement et, dans le Sud, passez par un accompagnateur agréé.", ar: "يُتسامح عمومًا مع المبيت القصير في الطبيعة، لكن بعض المناطق (الحدائق، المواقع المحمية، الجوار العسكري) منظّمة. استفسر محليًا، وفي الجنوب مرّ عبر مرافق معتمد." },
      },
      {
        q: { fr: "Tente ou nuit à la belle étoile ?", ar: "خيمة أم نوم تحت النجوم؟" },
        a: { fr: "Pour une première fois, la tente reste plus sûre : elle protège du vent, de la rosée et des insectes. La belle étoile se savoure ensuite, par nuit claire et stable, avec un bon sursac.", ar: "في أول مرة، الخيمة أكثر أمانًا: تحميك من الرياح والندى والحشرات. أما النوم تحت النجوم فيُستمتع به لاحقًا، في ليلة صافية ومستقرّة، مع غطاء جيّد." },
      },
      {
        q: { fr: "Quelle température prévoir la nuit en montagne ?", ar: "ما درجة الحرارة المتوقّعة ليلًا في الجبل؟" },
        a: { fr: "Même en été, il n'est pas rare de descendre sous 10 °C en altitude. Prévoyez un sac de couchage avec une marge et une couche chaude pour le soir.", ar: "حتى في الصيف، ليس نادرًا أن تنخفض الحرارة دون 10 °م في المرتفعات. حضّر كيس نوم بهامش أمان وطبقة دافئة للمساء." },
      },
    ],
  },
  {
    slug: "choisir-rechaud-camping",
    title: {
      fr: "Comment choisir son réchaud de camping",
      ar: "كيف تختار موقد التخييم",
    },
    description: {
      fr: "Réchaud à gaz, multi-combustible ou à bois : les types, la puissance, le poids et l'usage pour choisir le réchaud adapté à votre façon de camper.",
      ar: "موقد غاز، متعدّد الوقود أو حطب: الأنواع، القدرة، الوزن والاستعمال لاختيار الموقد المناسب لطريقة تخييمك.",
    },
    excerpt: {
      fr: "Gaz, essence ou bois ? Puissance, poids et usage : le guide pour bien cuisiner en plein air.",
      ar: "غاز، بنزين أم حطب؟ القدرة والوزن والاستعمال: دليل للطبخ الجيّد في الهواء الطلق.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 7,
    relatedCategories: ["cuisine-outdoor"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "Un café chaud au lever et un repas réconfortant le soir changent tout en camping. Le réchaud est l'outil qui rend cela possible, mais tous ne se valent pas selon votre usage : week-end près de la voiture, randonnée légère ou expédition. Voici comment choisir.",
          ar: "قهوة ساخنة عند الاستيقاظ ووجبة دافئة مساءً تغيّر كل شيء في التخييم. الموقد هو الأداة التي تجعل ذلك ممكنًا، لكنها ليست كلها سواء حسب استعمالك: عطلة قرب السيارة، مشي خفيف أو رحلة طويلة. إليك كيف تختار.",
        },
      },
      { type: "h2", text: { fr: "Les grands types de réchauds", ar: "الأنواع الرئيسية للمواقد" } },
      {
        type: "ul",
        items: [
          { fr: "À cartouche de gaz : simple, propre et rapide à allumer. Le meilleur choix pour débuter et pour la majorité des sorties.", ar: "بقارورة غاز: بسيط، نظيف وسريع الإشعال. الخيار الأفضل للبداية ولأغلب الخرجات." },
          { fr: "Multi-combustible (essence/pétrole) : puissant et fiable par grand froid et en altitude, mais plus technique à entretenir.", ar: "متعدّد الوقود (بنزين/كيروسين): قوي وموثوق في البرد الشديد والارتفاعات، لكنه أكثر تقنية في الصيانة." },
          { fr: "À bois : pas de combustible à transporter, mais dépend du bois sec disponible et interdit en période de risque d'incendie.", ar: "بالحطب: لا وقود للحمل، لكنه يعتمد على توفّر حطب جاف وممنوع في فترات خطر الحرائق." },
        ],
      },
      { type: "h2", text: { fr: "La puissance et le temps de chauffe", ar: "القدرة وزمن التسخين" } },
      {
        type: "p",
        text: {
          fr: "La puissance s'exprime en watts. Un réchaud puissant fait bouillir l'eau plus vite, ce qui est appréciable pour un groupe ou par vent. Pour un usage solo ou en duo, un modèle compact et économe en gaz suffit largement. Un pare-vent améliore nettement le rendement et réduit la consommation.",
          ar: "تُعبَّر القدرة بالواط. الموقد القوي يغلي الماء أسرع، وهو أمر مفيد لمجموعة أو في الرياح. للاستعمال الفردي أو الثنائي، نموذج صغير وموفّر للغاز يكفي تمامًا. حاجز الرياح يحسّن المردود بوضوح ويقلّل الاستهلاك.",
        },
      },
      { type: "h2", text: { fr: "Poids, encombrement et usage", ar: "الوزن والحجم والاستعمال" } },
      {
        type: "p",
        text: {
          fr: "Pour camper près de la voiture, privilégiez la stabilité et une large surface pour poser une vraie casserole. Pour la randonnée, visez un réchaud léger et compact qui se range dans la popote. Les systèmes intégrés (réchaud + casserole emboîtés) sont parfaits pour faire bouillir de l'eau rapidement en itinérance.",
          ar: "للتخييم قرب السيارة، فضّل الثبات وسطحًا عريضًا لوضع قدر حقيقي. للمشي الجبلي، استهدف موقدًا خفيفًا وصغيرًا يُحفظ داخل الأواني. الأنظمة المدمجة (موقد + قدر متداخلان) مثالية لغلي الماء بسرعة أثناء التنقّل.",
        },
      },
      { type: "h2", text: { fr: "Sécurité et entretien", ar: "السلامة والصيانة" } },
      {
        type: "ul",
        items: [
          { fr: "Cuisinez toujours à l'extérieur et dans un endroit ventilé, jamais sous la tente fermée", ar: "اطبخ دائمًا في الخارج وفي مكان جيّد التهوية، وليس داخل خيمة مغلقة أبدًا" },
          { fr: "Vérifiez l'étanchéité du raccord avant d'allumer et gardez le réchaud sur une surface stable", ar: "تحقّق من إحكام الوصلة قبل الإشعال وأبقِ الموقد على سطح ثابت" },
          { fr: "Emportez une cartouche de gaz de plus que nécessaire — le froid réduit le rendement", ar: "احمل قارورة غاز إضافية عن الحاجة — البرد يقلّل المردود" },
        ],
      },
      { type: "h2", text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" } },
      {
        type: "ul",
        items: [
          { fr: "Partir avec une cartouche presque vide, sans réserve : on tombe en panne au pire moment.", ar: "الانطلاق بقارورة شبه فارغة دون احتياطي: ينفد الغاز في أسوأ لحظة." },
          { fr: "Cuisiner sous la tente ou dans un espace fermé : risque réel d'intoxication au monoxyde de carbone.", ar: "الطبخ داخل الخيمة أو في مكان مغلق: خطر حقيقي للتسمّم بأول أكسيد الكربون." },
          { fr: "Oublier le pare-vent : sans lui, on gaspille le gaz et le temps de chauffe s'envole.", ar: "نسيان حاجز الرياح: بدونه يُهدر الغاز ويرتفع زمن التسخين كثيرًا." },
          { fr: "Poser le réchaud sur une surface instable ou inclinée, surtout avec une casserole pleine.", ar: "وضع الموقد على سطح غير ثابت أو مائل، خاصة مع قدر ممتلئ." },
        ],
      },
      { type: "h2", text: { fr: "L'essentiel à retenir", ar: "الخلاصة" } },
      {
        type: "p",
        text: {
          fr: "Pour la plupart des campeurs, un réchaud à gaz compact et stable, accompagné d'un pare-vent et d'une cartouche de réserve, couvre tous les besoins du week-end à la randonnée. Réservez le multi-combustible au grand froid et à l'altitude, et le réchaud à bois aux sorties où le bois sec est disponible et le feu autorisé. Dans tous les cas, on cuisine dehors, sur une surface stable.",
          ar: "لأغلب المخيّمين، موقد غاز صغير وثابت، مع حاجز رياح وقارورة احتياطية، يغطّي كل الاحتياجات من العطلة إلى المشي الجبلي. احتفظ بمتعدّد الوقود للبرد الشديد والارتفاعات، وبموقد الحطب للخرجات التي يتوفّر فيها حطب جاف ويُسمح فيها بالنار. وفي كل الأحوال، نطبخ في الخارج على سطح ثابت.",
        },
      },
    ],
    faq: [
      {
        q: { fr: "Le froid affecte-t-il le réchaud à gaz ?", ar: "هل يؤثّر البرد على موقد الغاز؟" },
        a: { fr: "Oui : par temps froid, le gaz perd de la pression et la chauffe ralentit. Gardez la cartouche au chaud (près du corps ou dans le sac de couchage) avant de l'utiliser, ou optez pour un modèle multi-combustible en hiver et en altitude.", ar: "نعم: في الطقس البارد يفقد الغاز ضغطه ويبطؤ التسخين. أبقِ القارورة دافئة (قرب الجسم أو داخل كيس النوم) قبل الاستعمال، أو اختر نموذجًا متعدّد الوقود في الشتاء والارتفاعات." },
      },
      {
        q: { fr: "Quel réchaud pour débuter ?", ar: "أي موقد للمبتدئ؟" },
        a: { fr: "Un réchaud à cartouche de gaz : il s'allume en quelques secondes, ne nécessite aucun entretien et couvre la grande majorité des usages en camping et en randonnée.", ar: "موقد بقارورة غاز: يشتعل في ثوانٍ، لا يحتاج صيانة، ويغطّي الأغلبية الساحقة من استعمالات التخييم والمشي." },
      },
      {
        q: { fr: "Combien de gaz prévoir ?", ar: "كم من الغاز أحضّر؟" },
        a: { fr: "Pour deux personnes sur un week-end (café, repas chauds), une cartouche standard suffit généralement. Par temps froid ou pour un groupe, prévoyez une cartouche de réserve.", ar: "لشخصين في عطلة (قهوة، وجبات ساخنة)، تكفي عادةً قارورة قياسية. في الطقس البارد أو لمجموعة، حضّر قارورة احتياطية." },
      },
      {
        q: { fr: "Peut-on cuisiner sous la tente ?", ar: "هل يمكن الطبخ داخل الخيمة؟" },
        a: { fr: "Non. Le risque d'incendie et surtout d'intoxication au monoxyde de carbone est réel. Cuisinez dehors, ou au pire sous un auvent largement ouvert et ventilé.", ar: "لا. خطر الحريق وخاصة التسمّم بأول أكسيد الكربون حقيقي. اطبخ في الخارج، أو في أسوأ الأحوال تحت سقيفة مفتوحة وجيّدة التهوية." },
      },
    ],
  },
  {
    slug: "choisir-lampe-frontale",
    title: {
      fr: "Lampe frontale et éclairage de camp : le guide",
      ar: "المصباح الأمامي وإنارة المخيم: الدليل",
    },
    description: {
      fr: "Lumens, autonomie, faisceau, étanchéité : comment choisir une lampe frontale et bien éclairer son campement, de la cuisine du soir aux déplacements de nuit.",
      ar: "اللومن، الاستقلالية، شعاع الضوء، مقاومة الماء: كيف تختار مصباحًا أماميًا وتنير مخيمك جيّدًا، من طبخ المساء إلى التنقّل ليلًا.",
    },
    excerpt: {
      fr: "Lumens, autonomie et étanchéité : comment bien voir la nuit, à la frontale comme à la lanterne.",
      ar: "اللومن، الاستقلالية ومقاومة الماء: كيف ترى جيّدًا ليلًا، بالمصباح الأمامي وبالفانوس.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 6,
    relatedCategories: ["eclairage"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "La nuit tombe vite en camping, et les mains libres font toute la différence : cuisiner, monter la tente, retrouver un objet ou marcher jusqu'au point d'eau. La lampe frontale est l'accessoire que l'on regrette le plus d'avoir oublié. Voici les critères qui comptent vraiment.",
          ar: "يحلّ الليل بسرعة في التخييم، واليدان الحرّتان تصنعان الفرق: الطبخ، نصب الخيمة، إيجاد غرض أو المشي إلى مصدر الماء. المصباح الأمامي هو الملحق الذي يندم المرء أكثر على نسيانه. إليك المعايير المهمّة فعلًا.",
        },
      },
      { type: "h2", text: { fr: "Les lumens (puissance)", ar: "اللومن (القوة)" } },
      {
        type: "p",
        text: {
          fr: "Les lumens mesurent la quantité de lumière. Pour la vie au campement (cuisine, lecture, rangement), 100 à 200 lumens suffisent largement. Pour marcher de nuit ou éclairer loin sur un sentier, visez 300 lumens ou plus. L'important n'est pas le maximum, mais d'avoir plusieurs modes pour ajuster.",
          ar: "يقيس اللومن كمية الضوء. لحياة المخيم (طبخ، قراءة، ترتيب)، تكفي 100 إلى 200 لومن تمامًا. للمشي ليلًا أو الإضاءة بعيدًا على مسلك، استهدف 300 لومن أو أكثر. المهم ليس الحد الأقصى، بل توفّر عدة أوضاع للضبط.",
        },
      },
      { type: "h2", text: { fr: "L'autonomie et l'alimentation", ar: "الاستقلالية ومصدر الطاقة" } },
      {
        type: "ul",
        items: [
          { fr: "Rechargeable (USB) : économique à l'usage et pratique avec une batterie externe, idéal en sorties courtes", ar: "قابل للشحن (USB): اقتصادي في الاستعمال وعملي مع بطارية خارجية، مثالي للخرجات القصيرة" },
          { fr: "À piles : on remplace les piles n'importe où, parfait pour les longues sorties loin d'une prise", ar: "بالبطاريات: تستبدل البطاريات في أي مكان، مثالي للخرجات الطويلة بعيدًا عن المقبس" },
          { fr: "Vérifiez l'autonomie annoncée au mode que vous utiliserez réellement, pas au mode le plus faible", ar: "تحقّق من الاستقلالية المعلنة في الوضع الذي ستستعمله فعلًا، وليس الوضع الأضعف" },
        ],
      },
      { type: "h2", text: { fr: "Faisceau, modes et confort", ar: "شعاع الضوء، الأوضاع والراحة" } },
      {
        type: "p",
        text: {
          fr: "Un bon faisceau large éclaire de près (cuisine, tente) tandis qu'un faisceau focalisé porte loin (marche). Les modèles avec mode rouge préservent la vision nocturne et n'éblouissent pas vos compagnons sous la tente. Côté confort, un bandeau réglable et un boîtier léger se font oublier sur la tête.",
          ar: "الشعاع العريض الجيّد يضيء من قرب (طبخ، خيمة) بينما الشعاع المركّز يصل بعيدًا (مشي). النماذج ذات الوضع الأحمر تحافظ على الرؤية الليلية ولا تُبهر رفاقك داخل الخيمة. ومن حيث الراحة، شريط قابل للضبط وعلبة خفيفة يُنسيانك وجودهما على الرأس.",
        },
      },
      { type: "h2", text: { fr: "L'étanchéité (indice IPX)", ar: "مقاومة الماء (مؤشر IPX)" } },
      {
        type: "p",
        text: {
          fr: "L'indice IPX indique la résistance à l'eau. Un IPX4 (résistant aux éclaboussures et à la pluie) est un minimum confortable pour le camping. Pensez aussi à une lanterne ou à une lampe de tente pour un éclairage d'ambiance, plus agréable qu'une frontale pour les repas en groupe.",
          ar: "يشير مؤشر IPX إلى مقاومة الماء. الدرجة IPX4 (مقاوم للرذاذ والمطر) هي حدّ أدنى مريح للتخييم. فكّر أيضًا في فانوس أو مصباح خيمة لإضاءة محيطة، ألطف من المصباح الأمامي لوجبات المجموعة.",
        },
      },
      { type: "h2", text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" } },
      {
        type: "ul",
        items: [
          { fr: "Choisir uniquement sur le nombre de lumens maximal, en ignorant l'autonomie réelle.", ar: "الاختيار فقط بناءً على أقصى عدد لومن، مع تجاهل الاستقلالية الحقيقية." },
          { fr: "Partir sans piles ou batterie de rechange : une lampe éteinte ne sert à rien.", ar: "الانطلاق دون بطاريات احتياطية: المصباح المُطفأ لا فائدة منه." },
          { fr: "Négliger l'étanchéité : une lampe qui rend l'âme sous la pluie vous laisse dans le noir.", ar: "إهمال مقاومة الماء: مصباح يتعطّل تحت المطر يتركك في الظلام." },
          { fr: "N'avoir qu'une frontale : une lanterne rend les repas et la vie au camp bien plus agréables.", ar: "الاكتفاء بمصباح أمامي: الفانوس يجعل الوجبات وحياة المخيم ألطف بكثير." },
        ],
      },
      { type: "h2", text: { fr: "L'essentiel à retenir", ar: "الخلاصة" } },
      {
        type: "p",
        text: {
          fr: "Pour le camping, visez 100 à 200 lumens pour la vie au campement et 300 lumens ou plus si vous marchez de nuit, avec plusieurs modes (dont un mode rouge), une bonne autonomie au niveau que vous utilisez réellement, et au moins un indice IPX4. Le combo idéal : une frontale pour avoir les mains libres, et une lanterne pour l'ambiance des repas en groupe.",
          ar: "للتخييم، استهدف 100 إلى 200 لومن لحياة المخيم و300 لومن أو أكثر إذا كنت تمشي ليلًا، مع عدة أوضاع (منها وضع أحمر)، استقلالية جيّدة في المستوى الذي تستعمله فعلًا، ودرجة IPX4 على الأقل. والمزيج المثالي: مصباح أمامي لتبقى يداك حرّتين، وفانوس لأجواء وجبات المجموعة.",
        },
      },
    ],
    faq: [
      {
        q: { fr: "Combien de temps tient une lampe frontale ?", ar: "كم تدوم شحنة المصباح الأمامي؟" },
        a: { fr: "Cela dépend du mode : quelques heures à pleine puissance, parfois des dizaines d'heures en mode économique. Fiez-vous à l'autonomie annoncée au niveau que vous utiliserez vraiment, et prévoyez toujours une recharge ou des piles de secours.", ar: "يعتمد على الوضع: بضع ساعات بكامل القوة، وأحيانًا عشرات الساعات في الوضع الاقتصادي. اعتمد على الاستقلالية المعلنة في المستوى الذي ستستعمله فعلًا، واحمل دائمًا شحنًا أو بطاريات احتياطية." },
      },
      {
        q: { fr: "Combien de lumens pour le camping ?", ar: "كم لومن للتخييم؟" },
        a: { fr: "100 à 200 lumens couvrent la vie au campement. Montez à 300 lumens et plus si vous prévoyez de marcher ou de courir de nuit.", ar: "100 إلى 200 لومن تغطّي حياة المخيم. ارفع إلى 300 لومن وأكثر إذا كنت تنوي المشي أو الجري ليلًا." },
      },
      {
        q: { fr: "Rechargeable ou à piles ?", ar: "قابل للشحن أم بالبطاريات؟" },
        a: { fr: "Rechargeable pour les sorties courtes (économique avec une batterie externe). À piles pour les longues sorties loin d'une prise, car on remplace les piles partout.", ar: "قابل للشحن للخرجات القصيرة (اقتصادي مع بطارية خارجية). بالبطاريات للخرجات الطويلة بعيدًا عن المقبس، لأنك تستبدل البطاريات في كل مكان." },
      },
      {
        q: { fr: "À quoi sert le mode rouge ?", ar: "ما فائدة الوضع الأحمر؟" },
        a: { fr: "Il préserve votre vision nocturne et évite d'éblouir les autres. Pratique sous la tente, pour lire une carte ou ne pas réveiller ses voisins.", ar: "يحافظ على رؤيتك الليلية ويتجنّب إبهار الآخرين. عملي داخل الخيمة، لقراءة خريطة أو لعدم إيقاظ الجيران." },
      },
    ],
  },
  {
    slug: "choisir-sac-a-dos-randonnee",
    title: {
      fr: "Choisir son sac à dos de randonnée",
      ar: "كيف تختار حقيبة ظهر للمشي الجبلي",
    },
    description: {
      fr: "Volume, portage, réglages et confort : comment choisir un sac à dos de randonnée à la bonne taille et bien le régler pour porter sans douleur.",
      ar: "الحجم، الحمل، الضبط والراحة: كيف تختار حقيبة ظهر للمشي بالحجم المناسب وتضبطها جيّدًا لتحمل دون ألم.",
    },
    excerpt: {
      fr: "Quel volume en litres, comment régler le portage et porter le poids sur les hanches : le guide complet.",
      ar: "كم لترًا، كيف تضبط الحمل وتنقل الوزن إلى الوركين: الدليل الكامل.",
    },
    datePublished: "2026-06-03",
    readingMinutes: 7,
    relatedCategories: ["sacs-a-dos", "randonnee"],
    blocks: [
      {
        type: "p",
        text: {
          fr: "Un sac à dos mal choisi ou mal réglé, et c'est le dos et les épaules qui paient l'addition. Le bon sac, lui, se fait presque oublier : le poids repose sur les hanches, le centre de gravité reste proche du corps, et chaque chose a sa place. Voici comment le choisir.",
          ar: "حقيبة ظهر سيّئة الاختيار أو الضبط، فيدفع الظهر والكتفان الثمن. أما الحقيبة الجيّدة فتكاد تُنسى: الوزن يرتكز على الوركين، ومركز الثقل يبقى قريبًا من الجسم، ولكل شيء مكانه. إليك كيف تختارها.",
        },
      },
      { type: "h2", text: { fr: "Le volume (en litres) selon la sortie", ar: "الحجم (باللتر) حسب الخرجة" } },
      {
        type: "ul",
        items: [
          { fr: "20–30 L : sortie à la journée (eau, en-cas, coupe-vent, petite trousse)", ar: "20–30 ل: خرجة ليوم واحد (ماء، وجبة خفيفة، صادّ للريح، علبة صغيرة)" },
          { fr: "35–50 L : week-end et bivouac d'une à deux nuits", ar: "35–50 ل: عطلة نهاية أسبوع ومبيت ليلة إلى ليلتين" },
          { fr: "55–70 L et plus : itinérance de plusieurs jours en autonomie", ar: "55–70 ل وأكثر: تنقّل لعدة أيام بالاعتماد على النفس" },
        ],
      },
      { type: "h2", text: { fr: "La taille du dos, pas votre taille", ar: "طول الظهر، وليس طولك" } },
      {
        type: "p",
        text: {
          fr: "Un sac se choisit d'abord à la longueur de votre dos (du haut des épaules au creux des reins), pas à votre taille générale. Beaucoup de modèles offrent un dos réglable ou plusieurs tailles. Un bon ajustement, c'est la ceinture ventrale qui tombe pile sur les hanches : c'est là que doit reposer l'essentiel du poids.",
          ar: "تُختار الحقيبة أولًا حسب طول ظهرك (من أعلى الكتفين إلى أسفل الظهر)، وليس طولك العام. كثير من النماذج توفّر ظهرًا قابلًا للضبط أو عدة مقاسات. الضبط الجيّد يعني أن يقع حزام الخصر تمامًا على الوركين: فهناك يجب أن يرتكز معظم الوزن.",
        },
      },
      { type: "h2", text: { fr: "Bien régler son sac (dans l'ordre)", ar: "ضبط الحقيبة جيّدًا (بالترتيب)" } },
      {
        type: "ul",
        items: [
          { fr: "1. Desserrez tout, puis serrez d'abord la ceinture ventrale sur les hanches", ar: "1. أرخِ كل شيء، ثم اربط أولًا حزام الخصر على الوركين" },
          { fr: "2. Ajustez les bretelles sans qu'elles supportent tout le poids", ar: "2. اضبط حمّالتي الكتف دون أن تتحمّلا كل الوزن" },
          { fr: "3. Tirez les rappels de charge (en haut des bretelles) pour rapprocher le sac du dos", ar: "3. اسحب مشدّات الحمل (أعلى الحمّالتين) لتقريب الحقيبة من الظهر" },
          { fr: "4. Clipsez la sangle de poitrine pour stabiliser l'ensemble", ar: "4. اربط حزام الصدر لتثبيت المجموعة" },
        ],
      },
      { type: "h2", text: { fr: "Organisation et météo", ar: "التنظيم والطقس" } },
      {
        type: "p",
        text: {
          fr: "Placez les objets lourds près du dos et au centre, les affaires légères en bas, et ce dont vous avez besoin souvent (eau, veste, snacks) dans les poches accessibles. Pensez à un sursac ou une housse imperméable : peu de sacs sont réellement étanches sous une averse soutenue.",
          ar: "ضع الأغراض الثقيلة قرب الظهر وفي الوسط، والأشياء الخفيفة في الأسفل، وما تحتاجه كثيرًا (ماء، سترة، وجبات خفيفة) في الجيوب سهلة الوصول. فكّر في غطاء مقاوم للماء: قليل من الحقائب مقاوم فعلًا للماء تحت مطر غزير.",
        },
      },
      { type: "h2", text: { fr: "Les erreurs fréquentes à éviter", ar: "الأخطاء الشائعة التي يجب تجنّبها" } },
      {
        type: "ul",
        items: [
          { fr: "Choisir un volume trop grand : on finit toujours par le remplir, et on porte trop lourd.", ar: "اختيار حجم كبير جدًا: ينتهي بك الأمر إلى ملئه دائمًا، فتحمل وزنًا أثقل." },
          { fr: "Faire reposer le poids sur les épaules au lieu des hanches.", ar: "جعل الوزن يرتكز على الكتفين بدل الوركين." },
          { fr: "Placer les objets lourds en bas ou loin du dos : le sac devient instable et tire en arrière.", ar: "وضع الأغراض الثقيلة في الأسفل أو بعيدًا عن الظهر: تصبح الحقيبة غير مستقرّة وتشدّ إلى الخلف." },
          { fr: "Négliger la housse de pluie : très peu de sacs sont réellement étanches.", ar: "إهمال غطاء المطر: قليل جدًا من الحقائب مقاوم فعلًا للماء." },
        ],
      },
      { type: "h2", text: { fr: "L'essentiel à retenir", ar: "الخلاصة" } },
      {
        type: "p",
        text: {
          fr: "Le bon sac, c'est le bon volume pour la sortie (20–30 L à la journée, 35–50 L le week-end, 55 L et plus en itinérance), à la bonne taille de dos, réglé dans l'ordre : ceinture ventrale, bretelles, rappels de charge, sangle de poitrine. Le poids repose sur les hanches et reste près du dos. Sur un sac à porter des heures, le confort de portage prime sur tout le reste — essayez-le chargé avant de choisir.",
          ar: "الحقيبة الجيّدة هي الحجم المناسب للخرجة (20–30 ل لليوم، 35–50 ل لعطلة نهاية الأسبوع، 55 ل وأكثر للتنقّل)، بطول الظهر المناسب، مضبوطة بالترتيب: حزام الخصر، الحمّالتان، مشدّات الحمل، حزام الصدر. يرتكز الوزن على الوركين ويبقى قريبًا من الظهر. وفي حقيبة تُحمل ساعات، راحة الحمل تتقدّم على كل شيء — جرّبها محمّلة قبل الاختيار.",
        },
      },
    ],
    faq: [
      {
        q: { fr: "Comment répartir le poids dans le sac ?", ar: "كيف أوزّع الوزن داخل الحقيبة؟" },
        a: { fr: "Les objets lourds près du dos et au centre, les plus légers en bas, et ce dont vous avez besoin souvent (eau, veste, en-cas) dans les poches accessibles. Un sac bien équilibré se porte droit, sans tirer vers l'arrière.", ar: "الأغراض الثقيلة قرب الظهر وفي الوسط، والأخفّ في الأسفل، وما تحتاجه كثيرًا (ماء، سترة، وجبة خفيفة) في الجيوب سهلة الوصول. الحقيبة المتوازنة تُحمل باستقامة دون أن تشدّ إلى الخلف." },
      },
      {
        q: { fr: "Quel volume pour un week-end ?", ar: "كم لترًا لعطلة نهاية أسبوع؟" },
        a: { fr: "Entre 35 et 50 litres suffisent pour une à deux nuits avec tente, sac de couchage et nourriture, à condition de garder un matériel compact.", ar: "بين 35 و50 لترًا تكفي لليلة إلى ليلتين مع خيمة وكيس نوم وطعام، بشرط إبقاء المعدات صغيرة الحجم." },
      },
      {
        q: { fr: "Comment éviter le mal de dos ?", ar: "كيف أتجنّب آلام الظهر؟" },
        a: { fr: "Choisissez la bonne taille de dos, et faites reposer le poids sur les hanches via la ceinture ventrale, pas sur les épaules. Placez les objets lourds près du dos.", ar: "اختر طول الظهر الصحيح، واجعل الوزن يرتكز على الوركين عبر حزام الخصر، وليس على الكتفين. ضع الأغراض الثقيلة قرب الظهر." },
      },
      {
        q: { fr: "Faut-il une housse de pluie ?", ar: "هل أحتاج غطاء مطر؟" },
        a: { fr: "Oui, c'est vivement recommandé : la plupart des sacs ne sont pas étanches. Une housse, ou des sacs étanches à l'intérieur, garderont vos affaires au sec.", ar: "نعم، يُنصح به بشدّة: أغلب الحقائب ليست مقاومة للماء. غطاء، أو أكياس مقاومة للماء بالداخل، تبقي أغراضك جافة." },
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export const guideSlugs = GUIDES.map((g) => g.slug);
