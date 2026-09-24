// Lightweight eojeol rules, not a full morphological parser. Strong endings
// are recognized independently of the imagery vocabulary; ambiguous short
// endings require a known stem or an explicit conversational form.
const nouns = new Set('바다 나비 고양이 강아지 이야기 사과 소나기 공기 향기 아기 딸기 토끼 거미 종이 오이 모기 사진 우주 라디오'.split(' '));
const conversational = new Set('예뻐 아파 고마워 반가워 무서워 어려워 쉬워 추워 더워 아름다워 즐거워 슬퍼 기뻐 귀여워 그리워 외로워 배고파 괜찮아 싫어 좋아 달라 몰라 알아 불러 골라 흘러 그려 들려 보여 줘 와 가 해 돼 봐 자 서'.split(' '));
const stems = /^(?:듣|들|먹|마시|마셨|보|봤|바라보|바라봤|바라본|그리|그려|그렸|걷|걸|달리|달려|뛰|날|흐르|흘|움직|비추|비춰|비춘|만나|기다리|웃|울|노래하|춤추|춤춰|빛나|반짝|불|피|자|잠|읽|쓰|써|건너|그치|내리|내려|오르|올라|떠나|멈추|생각하|느끼|알|모르|배우|살|죽|잡|놓|만들|주|받|하|해|했|되|돼|있|없|싶|좋|싫|앉|누워|눕|일어나)/u;

export function koreanRole(token) {
  if (!/^[가-힣]+$/u.test(token)) return undefined;
  if (nouns.has(token)) return 'word';
  if (/^(?:정말|참|너무|아주|매우|늘|항상|다시|함께|서로|벌써|아직|조금|더|가장|꼭|안|못|잘|또)$/u.test(token)) return 'adverb';
  if (/^.+의$/u.test(token)) return 'possessive';
  if (conversational.has(token)) return 'predicate';
  if (/(?:이야|이야요|이에요|예요|입니다|이었어|였어|이었어요|였어요|이네|이죠|인가요|일까)$/u.test(token)) return 'predicate';
  if (/(?:았어요|었어요|였어요|았어|었어|였어|겠어|겠어요|겠지|겠네|잖아|잖아요|네요|나요|군요|구나|는구나|습니다|습니까)$/u.test(token)) return 'predicate';
  if (stems.test(token) && /(?:으며|면서|지만|는데|어서|아서|고|며|면|니|지|네|어|아|려|워|줘|해|돼|봐|요)$/u.test(token)) return 'predicate';
  if (stems.test(token) && /(?:는|던|었던|았던)$/u.test(token)) return 'participle';
  if (/(?:에게서|한테서|에서|에게|한테|으로|까지|부터|에)(?:는|도|만)?$/u.test(token)) return 'place';
  if (/(?:을|를)(?:도|만)?$/u.test(token)) return 'object';
  if (/^(?:나|너|저|우리|저희|그|그녀)(?:도|만)$/u.test(token)) return 'subject';
  return undefined;
}
