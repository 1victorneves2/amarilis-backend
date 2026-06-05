import prisma from '../lib/prisma';

const enrichments: Record<string, string> = {
  'base-liquida-fps30': `Esta base líquida de alta performance combina cobertura completa e inteligente com proteção solar FPS 30 de amplo espectro. Sua fórmula exclusiva com ácido hialurônico e vitamina E hidrata a pele ao longo do dia enquanto nivela a textura e apaga imperfeições. O acabamento natural luminoso imita a pele saudável e não coça em pisos porosos. Ideal para todos os tipos de pele, inclusive mista a oleosa. Dermatologicamente testado.

Benefícios: cobertura alta e flexível, hidratação de longa duração, proteção solar UVA/UVB, acabamento natural sem aspecto de máscara.

Modo de uso: aplique com pincel, esponja ou dedos sobre a pele limpa e hidratada. Espalhe em movimentos suaves do centro para as extremidades do rosto. Reaplique o FPS a cada 2 horas em caso de exposição solar prolongada.

Ingredientes principais: água, ácido hialurônico, vitamina E, filtros solares UVA/UVB, dimeticone, niacinamida.`,

  'batom-matte-vermelho': `O batom matte vermelho mais querido da temporada chegou com fórmula enriquecida com manteiga de karité e vitamina E para nutrir os lábios enquanto entrega um vermelho intenso e sedutor. A textura cremosa e aterciopelada não resseca e garante até 8 horas de fixação sem retoque. Pigmentação máxima em uma única passagem.

Benefícios: cor intensa com pigmentação máxima, hidratação labial com karité, longa duração de até 8h, acabamento matte elegante.

Modo de uso: contorne os lábios com delineador labial (opcional) e aplique o batom do centro para as extremidades. Para maior precisão, use um pincel labial.

Ingredientes principais: manteiga de karité, vitamina E, cera de carnaúba, pigmentos de ferro, dióxido de titânio.`,

  'paleta-sombras-12': `Uma paleta completa com 12 tons cuidadosamente selecionados para criar looks do dia a dia aos mais dramáticos. A combinação de tons nude, terrosos, rosados e esfumados profundos em acabamentos matte, shimmer e glitter permite infinitas combinações. Fórmula vegana com alta pigmentação e aderência que dura o dia todo.

Benefícios: 12 cores versáteis, acabamentos matte, shimmer e glitter, alta pigmentação, longa duração, fórmula vegana.

Modo de uso: aplique com pincel de sombras. Para looks mais intensos, umideça o pincel levemente. Esfume com pincel limpo para transições suaves. Ideal para técnica cut crease, halo eye e smoky eye.

Ingredientes principais: mica, talco, estearato de magnésio, dióxido de titânio, pigmentos cosméticos.`,

  'blush-natural-rose': `Este blush em pó de textura ultra-fina proporciona um rubor natural e luminoso que imita o frescor de bochechas naturalmente rosadas. Fórmula com pérolas luminosas sutis que não pesam no rosto e se integram perfeitamente a qualquer tom de pele clara a média. Buildable: construa da cor suave ao look mais vibrante.

Benefícios: acabamento natural e fresco, buildable (intensidade ajustável), pérolas luminosas sutis, longa duração.

Modo de uso: sorria levemente e aplique nas maçãs do rosto com pincel de blush em movimentos circulares suaves, esfumando em direção às têmporas. Use com moderação para um efeito natural.

Ingredientes principais: talco, mica, silica, pigmentos cosméticos, extrato de rosa.`,

  'rimel-volume-extremo': `Rímel de fórmula exclusiva com fibras de nylon que multiplicam o volume e o comprimento dos cílios em até 3x com apenas uma demão. O pincel cônico de cerdas densas envolve cada cílho desde a raiz até a ponta, garantindo separação perfeita sem grumos. Resistente à água e à seborreia. Remove facilmente com demaquilante bifásico.

Benefícios: volume extremo em uma demão, alongamento com fibras de nylon, separação perfeita dos cílios, resistente à água.

Modo de uso: com os olhos abertos, aplique o pincel na raiz dos cílios e suba em ziguezague até as pontas. Aplique uma segunda demão para mais volume. Deixe secar completamente entre as camadas.

Ingredientes principais: cera de carnaúba, polímero de volume, fibras de nylon, glicerina, pigmento preto.`,

  'serum-vitamina-c-20': `Sérum de alta performance com 20% de ácido ascórbico puro estabilizado em pH 3,5 para máxima eficácia. Esta concentração profissional combate manchas, uniformiza o tom da pele e estimula a produção de colágeno visível em apenas 4 semanas de uso contínuo. O complexo antioxidante com vitamina E e ácido ferúlico potencializa a ação da vitamina C e protege contra radicais livres.

Benefícios: clareamento de manchas e melasma, estimulo de colágeno, uniformização do tom, poderoso antioxidante, radiância imediata.

Modo de uso: aplique 3 a 5 gotas no rosto e pescoço pela manhã sobre a pele limpa e seca antes do hidratante e protetor solar. Evite a área dos olhos. Introduza gradualmente: comece usando dia sim, dia não.

Ingredientes principais: ácido ascórbico 20%, vitamina E (tocoferol), ácido ferúlico, ácido hialurônico, água destilada.`,

  'hidratante-facial-fps50': `Hidratante facial de textura leve tipo gel-creme que hidrata profundamente sem sensação gordurosa enquanto oferece proteção solar de amplo espectro FPS 50. Ideal para uso diário, inclusive sob a maquiagem. A fórmula com niacinamida reduz poros dilatados e controla a oleosidade ao longo do dia. Testado em pele sensível e oleosa.

Benefícios: hidratação 24h, FPS 50 UVA/UVB, controle de oleosidade com niacinamida, poros minimizados, textura leve sem brilho.

Modo de uso: aplique generosamente no rosto e pescoço pela manhã após a limpeza. Espalhe em movimentos circulares até completa absorção. Reaplique a cada 2 horas em exposição solar.

Ingredientes principais: niacinamida 5%, ácido hialurônico, filtros solares UVA/UVB, glicerina, extrato de chá verde.`,

  'acido-hialuronico-concentrado': `Sérum de ácido hialurônico de tripla ação com moléculas de alto, médio e baixo peso molecular que hidratam em diferentes camadas da pele simultaneamente. A fórmula de alta concentração com complexo PRO-HA preenche as linhas de expressão de dentro para fora e melhora a elasticidade da pele em até 40% após 28 dias. Textura aguada que absorve instantaneamente.

Benefícios: hidratação profunda em 3 camadas, preenchimento de linhas finas, melhora de elasticidade, efeito plumping imediato, adequado para todas as idades.

Modo de uso: aplique 4 gotas no rosto e pescoço úmidos (a umidade potencializa o AH) pela manhã e/ou noite. Complete com hidratante para selar a hidratação.

Ingredientes principais: ácido hialurônico de alto/médio/baixo PM, complexo PRO-HA, glicerina, pantenol, aloe vera.`,

  'tonico-micelar-calmante': `Tônico micelar bifuncional que remove resíduos de maquiagem leve, excesso de sebo e impurezas enquanto prepara a pele para absorver melhor os próximos passos da rotina. A fórmula sem álcool com extrato de camomila e água termal acalma a pele sensível e reduz vermelhidões. Adequado para pele reativa, com rosácea ou após procedimentos estéticos.

Benefícios: limpeza profunda sem ressecamento, sem álcool e sem fragância, acalma vermelhidão com camomila, equilibra o pH, prepara a pele para o restante da rotina.

Modo de uso: aplique em um disco de algodão ou diretamente nas mãos e passe suavemente por todo o rosto pela manhã e à noite. Não precisa enxaguar. Use antes do sérum e hidratante.

Ingredientes principais: água termal, micelas, extrato de camomila, alantoína, ácido pantotênico, glicerina.`,

  'edp-floral': `Eau de Parfum de longa duração com sillage marcante e assinatura inconfundível. Notas de abertura de pêssego e pera se fundem suavemente ao coração floral de jasmim sambac, rosa de damasco e ylang-ylang. O fundo quente de sândalo branco, almíscar e âmbar garante uma trilha sensual que persiste por até 8 horas na pele.

Benefícios: longevidade de até 8 horas, sillage marcante e elegante, fragrância exclusiva, frasco sofisticado para presente.

Modo de uso: borrifar nos pontos de pulso (pulso, atrás do joelho, pescoço) a 15–20 cm de distância. Não esfregar após aplicação. Para maior duração, aplique sobre pele hidratada.

Notas olfativas: cabeça – pêssego, pera | coração – jasmim sambac, rosa de damasco, ylang-ylang | fundo – sândalo branco, âmbar, almíscar.`,

  'colonia-citrica-fresca': `Colônia refrescante e revitalizante com abertura explosiva de bergamota, limão siciliano e toranja que evoca energia e leveza. O coração herbáceo de alecrim e folha de violeta adiciona frescor e sofisticação. Base leve de cedro branco e musgo de carvalho ancora o frescor por todo o dia. Perfeita para o dia a dia e climas quentes.

Benefícios: frescor duradouro e revitalizante, leve e não enjoativo, versátil para qualquer momento do dia, fixação de 4 a 6 horas.

Modo de uso: aplique nos pulsos, pescoço e atrás das orelhas após o banho. Para efeito refrescante em dias quentes, guarde na geladeira antes de usar.

Notas olfativas: cabeça – bergamota, limão siciliano, toranja | coração – alecrim, folha de violeta | fundo – cedro branco, musgo de carvalho.`,

  'perfume-oriental-amadeirado': `Fragrância oriental de personalidade marcante para quem não passa despercebida. A abertura de cardamomo e pimenta negra cria um frescor especiado que evolui para um coração luxuoso de rosa búlgara e íris. A base profunda e sedutora de sândalo de Mysore, oud marroquino e baunilha bourbon garante uma memória olfativa inesquecível.

Benefícios: sillage intenso e marcante, longevidade excepcional de até 12 horas, fragrância de luxo acessível, adequada para ocasiões especiais e uso noturno.

Modo de uso: aplique com moderação — uma ou duas borrifadas são suficientes. Pontos de calor do corpo (pulso, pescoço, decote). Evite uso excessivo em ambientes fechados.

Notas olfativas: cabeça – cardamomo, pimenta negra | coração – rosa búlgara, íris | fundo – sândalo de Mysore, oud, baunilha bourbon.`,

  'body-splash-tropical': `Body splash leve e divertido com alta concentração de frutas tropicais que transporta para praias paradisíacas ao primeiro borrifo. Notas de manga, maracujá e coco se misturam ao fundo suave de almíscar branco criando uma fragrância alegre e refrescante. Ideal para o verão e uso pós-banho.

Benefícios: frescor imediato, fragrância alegre e tropical, leve e não pesado, aplicação generosa sem enjoar, ideal para o verão.

Modo de uso: borrifar generosamente pelo corpo após o banho ou durante o dia para refrescar. Pode ser reaplicado quantas vezes desejar. Ótimo para usar nos cabelos também.

Notas olfativas: manga, maracujá, coco, flor tropical, almíscar branco.`,

  'shampoo-reconstrutor': `Shampoo reconstrutor com queratina hidrolisada e complexo de aminoácidos que penetra na fibra capilar danificada e reconstrói de dentro para fora. Ideal para cabelos quimicamente tratados, coloridos ou com pontas duplas. A fórmula com pH controlado sela as cutículas, reduz o volume excessivo e devolve o brilho perdido já na primeira lavagem.

Benefícios: reconstrução profunda da fibra capilar, redução do frizz, brilho intenso desde a primeira lavagem, prolonga a duração da coloração.

Modo de uso: aplique nos cabelos molhados, massageando o couro cabeludo por 2 a 3 minutos. Enxagúe bem. Para resultados otimizados, use junto com a Máscara de Hidratação Intensa.

Ingredientes principais: queratina hidrolisada, aminoácidos da seda, proteína de trigo, pantenol, extrato de argan.`,

  'mascara-hidratacao-intensa': `Máscara capilar de imersão com manteiga de karité africano e óleo de argan marroquino que nutre profundamente fios porosos e ressecados. A tecnologia de deposição capilar garante que os ativos penetrem no córtex do cabelo, restaurando a maciez, o brilho e a elasticidade. Resultados visíveis após a primeira aplicação.

Benefícios: nutrição profunda, restauração de maciez e elasticidade, brilho espelhado, frizz controlado, ideal para cabelos 3A a 4C.

Modo de uso: aplique generosamente nos cabelos úmidos e limpos, do comprimento às pontas. Deixe agir por 15 a 20 minutos (use touca térmica para potencializar). Enxagúe abundantemente.

Ingredientes principais: manteiga de karité, óleo de argan, proteína da seda, ácido hialurônico, vitamina E.`,

  'oleo-finalizador-brilho': `Óleo finalizador ultra-leve com toque seco que combate o frizz sem pesar ou deixar resíduo oleoso nos fios. A fórmula com óleo de argan, ciclometicone e extrato de camélia proporciona brilho espelhado, macia e proteção térmica de até 230°C para uso antes de prancha ou secador.

Benefícios: anti-frizz de longa duração, brilho espelhado sem oleosidade, proteção térmica até 230°C, toque seco e sedoso, leve e não acumula.

Modo de uso: aplique de 2 a 4 gotas nas palmas das mãos, aqueça levemente esfregando as mãos e distribua nos fios úmidos ou secos, evitando a raiz. Use antes do secador ou prancha para proteção térmica.

Ingredientes principais: ciclometicone, óleo de argan, extrato de camélia, dimeticone, vitamina E.`,

  'condicionador-nutritivo': `Condicionador nutritivo com proteínas da seda e extrato de queratina que fecha as cutículas abertas e restaura o equilíbrio hídrico dos fios. A textura cremosa e deslizante facilita o pentear, reduz a quebra por atrito mecânico e deixa os cabelos macios, com movimento e brilho natural. Fórmula sem sulfato e sem parabenos.

Benefícios: nutrição com proteínas da seda, fechamento de cutículas, facilita o desembaraçar, reduz quebra, sem sulfato/parabenos.

Modo de uso: após o shampoo, aplique no comprimento e nas pontas dos cabelos úmidos. Deixe agir por 3 a 5 minutos e enxagúe completamente. Não aplique na raiz.

Ingredientes principais: queratina hidrolisada, proteínas da seda, manteiga de murumuru, pantenol, extrato de babosa.`,

  'creme-hidratante-corporal': `Creme corporal de textura rica e envolvente com manteiga de karité não refinada que cria um manto protetor na pele seca e muito seca, promovendo hidratação de até 72 horas comprovada clinicamente. A fórmula com ceramidas e ácidos graxos essenciais restaura a barreira cutânea comprometida e alivia o desconforto imediato da pele ressecada.

Benefícios: hidratação de até 72h comprovada, restauração da barreira cutânea com ceramidas, alivia coceira e descamação, textura rica que absorve sem oleosidade residual.

Modo de uso: aplique generosamente por todo o corpo após o banho, com a pele ainda levemente úmida para potencializar a absorção. Dê atenção especial a cotovelos, joelhos e calcanhares. Use diariamente.

Ingredientes principais: manteiga de karité, ceramidas, ácido linoleico, glicerina, pantenol, alantoína.`,

  'esfoliante-corporal-acucar': `Esfoliante corporal de açúcar demerara com óleo de coco virgem e extrato de baunilha que remove células mortas, estimula a renovação celular e deixa a pele macia, lisa e perfumada. Os cristais de açúcar se dissolvem durante a massagem, evitando microlesões. Indicado para todos os tipos de pele, inclusive as mais sensíveis.

Benefícios: esfoliação delicada com cristais que se dissolvem, renovação celular acelerada, pele incrivelmente macia após o uso, aroma irresistível de baunilha.

Modo de uso: aplique na pele úmida e realize movimentos circulares por 2 a 3 minutos, com maior atenção a cotovelos, joelhos e calcanhares. Enxagúe bem. Use 2 a 3 vezes por semana. Aplique hidratante após o esfoliante.

Ingredientes principais: açúcar demerara, óleo de coco virgem, extrato de baunilha, vitamina E, glicerina.`,

  'oleo-corporal-relaxante': `Óleo corporal seco com essências terapêuticas de lavanda e camomila que acalmam a mente e o corpo enquanto nutrem e tornam a pele sedosa e luminosa. O blend de óleos de jojoba, amêndoas doces e rosa mosqueta absorve rapidamente sem deixar resíduo gorduroso. Ideal para massagem relaxante pré-sono.

Benefícios: ação calmante com aromaterapia, absorção rápida sem oleosidade, pele sedosa e luminosa, ideal para massagem, ótimo para ritual noturno.

Modo de uso: aplique algumas gotas nas palmas e massageie pelo corpo em movimentos lentos e circulares. Pode ser usado diretamente no banho (3 a 5 gotas na água do banho) ou após secar. Evite contato com olhos.

Ingredientes principais: óleo de jojoba, óleo de amêndoas doces, óleo de rosa mosqueta, essência de lavanda, essência de camomila.`,

  'sabonete-liquido-aromas': `Sabonete líquido suave com fragrâncias naturais extraídas de flores e frutas frescas que transformam o banho em um ritual de bem-estar. A fórmula dermatologicamente testada com aloe vera e glicerina limpa sem agredir a microbiota natural da pele, mantendo o equilíbrio e a hidratação. Sem sulfatos agressivos, sem parabenos, sem corantes artificiais.

Benefícios: limpeza suave sem ressecar, formulado com aloe vera e glicerina, sem sulfatos agressivos, pele hidratada e perfumada após o banho, refrescante.

Modo de uso: aplique na esponja ou diretamente na pele úmida, faça espuma e massageie suavemente. Enxagúe completamente. Pode ser usado no corpo e nas mãos.

Ingredientes principais: aloe vera, glicerina, extrato de flores naturais, pantenol, ácido lático, fragrâncias naturais.`,
};

async function main() {
  console.log('Enriching products...');

  let count = 0;
  for (const [slug, fullDescription] of Object.entries(enrichments)) {
    const result = await prisma.product.updateMany({
      where: { slug },
      data: { fullDescription },
    });
    if (result.count > 0) {
      console.log(`  ✓ ${slug}`);
      count++;
    } else {
      console.warn(`  ⚠ not found: ${slug}`);
    }
  }

  console.log(`\n✅ Products enriched! (${count}/${Object.keys(enrichments).length})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
