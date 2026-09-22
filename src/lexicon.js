// A deliberately local, human-readable bilingual image lexicon.
// Korean entries are mostly stems so particles and common conjugations still match.
const words = (ko, en) => ({
  ko: ko.trim().split(/\s+/u),
  en: en.trim().split(/\s+/u),
});

const concept = (id, label, layer, axes, ko, en) => ({
  id,
  label,
  layer,
  axes,
  words: words(ko, en),
});

export const CONCEPTS = [
  concept('light', '빛', 'near', { light: .3, warmth: .06, space: .05 },
    '빛 불빛 햇살 햇빛 볕 광채 반짝 번쩍 눈부신 밝 환한 투명 유리 수정 프리즘 무지개 등불 촛불 전등 조명 섬광 윤슬 아지랑이',
    'light glow gleam glimmer glitter shimmer shine bright radiant luminous sparkle flash clear crystal glass prism rainbow lantern candle lamp beam halo'),
  concept('darkness', '어둠', 'far', { light: -.28, tension: .12, space: .08 },
    '어둠 어두 컴컴 칠흑 암흑 그늘 그림자 검은 까만 먹빛 흐릿 희미 가려진',
    'dark darkness dim black shadow shade obscure murky dusky faint hidden eclipse silhouette'),
  concept('sun', '해와 낮', 'far', { light: .26, warmth: .18, space: .08 },
    '해 태양 한낮 낮 정오 일출 해돋이 해넘이 햇무리 양지',
    'sun sunlight sunshine daytime noon sunrise sunset solar daylight'),
  concept('moon', '달과 밤', 'far', { light: -.05, softness: .17, space: .22 },
    '달 달빛 월광 초승달 보름달 밤 밤중 한밤 별자리 은하 은하수 우주',
    'moon moonlight crescent fullmoon night midnight star constellation galaxy milkyway cosmos universe space'),
  concept('dawn', '새벽과 저녁', 'far', { light: .12, softness: .1, space: .16 },
    '새벽 아침 동틀녘 여명 황혼 저녁 노을 석양 땅거미 해질녘',
    'dawn morning daybreak sunrise twilight evening dusk sunset afterglow'),
  concept('water', '물', 'far', { motion: .09, softness: .18, space: .13 },
    '물 바다 바닷 대양 파도 물결 강 시내 개울 호수 연못 샘 우물 폭포 분수 수면 해변 모래사장 섬 항구 물방울 거품 빗물',
    'water sea ocean tide wave ripple river stream creek lake pond spring well waterfall fountain surface beach shore island harbor droplet bubble foam'),
  concept('rain', '비와 안개', 'far', { motion: .1, softness: .2, light: -.04, space: .12 },
    '비 빗물 빗방울 소나기 장마 이슬 안개 물안개 구름 먹구름 눈보라 우박 젖 축축',
    'rain rainy raindrop shower drizzle monsoon dew mist fog cloud stormcloud snowstorm hail wet damp'),
  concept('ice', '눈과 얼음', 'far', { warmth: -.27, light: .12, softness: -.08, space: .08 },
    '눈 눈송이 함박눈 얼음 빙하 서리 성에 고드름 얼어 차가 냉기 겨울',
    'snow snowflake ice iceberg glacier frost icicle frozen freeze cold chill winter'),
  concept('sky', '하늘과 공기', 'far', { space: .28, light: .09, softness: .08 },
    '하늘 창공 허공 공기 대기 수평선 지평선 높은 위 구름 천국',
    'sky air atmosphere horizon high above heaven aerial open vast'),
  concept('wind', '바람', 'far', { motion: .21, softness: .07, space: .16 },
    '바람 산들바람 미풍 돌풍 태풍 회오리 숨결 불어 휘날 흔들',
    'wind breeze gust gale hurricane typhoon whirlwind blow flutter sway'),
  concept('forest', '숲', 'far', { warmth: .09, softness: .1, space: .1 },
    '숲 나무 수풀 덤불 가지 줄기 뿌리 잎 나뭇잎 솔잎 이끼 풀 잔디 씨앗 열매 숲길 정원 들판 초원 봄',
    'forest woods tree grove bush branch trunk root leaf foliage pine moss grass seed fruit garden field meadow spring'),
  concept('flower', '꽃', 'near', { warmth: .15, light: .12, softness: .17 },
    '꽃 꽃잎 꽃봉오리 장미 민들레 해바라기 제비꽃 벚꽃 향기 꽃향 피어 만발',
    'flower petal blossom bloom bud rose dandelion sunflower violet cherry fragrance floral'),
  concept('earth', '땅과 돌', 'far', { warmth: -.01, softness: -.18, space: .1 },
    '땅 대지 흙 모래 진흙 돌 바위 자갈 산 언덕 계곡 절벽 동굴 사막 화산 섬 지층',
    'earth ground soil dirt sand mud stone rock pebble mountain hill valley cliff cave desert volcano terrain'),
  concept('fire', '불', 'near', { warmth: .31, light: .2, motion: .14, tension: .07 },
    '불 불빛 불꽃 화염 모닥불 장작 재 연기 타오르 뜨거 열기 용암',
    'fire flame blaze bonfire ember ash smoke burn burning hot heat lava'),
  concept('animal', '생명', 'near', { warmth: .11, motion: .18, softness: .05 },
    '새 참새 까치 까마귀 독수리 나비 벌 잠자리 고양이 강아지 개 토끼 여우 사슴 곰 물고기 고래 돌고래 생명 날개 깃털 꼬리',
    'bird sparrow magpie crow eagle butterfly bee dragonfly cat kitten dog puppy rabbit fox deer bear fish whale dolphin creature animal wing feather tail'),
  concept('voice', '소리와 목소리', 'near', { motion: .12, tension: .03, space: .07 },
    '소리 목소리 노래 음악 음 울림 메아리 속삭임 말 이야기 종소리 휘파람 박수 북 피아노 기타 현 리듬 멜로디 화음',
    'sound voice song music tone echo whisper word story bell whistle clap drum piano guitar string rhythm melody harmony chord'),
  concept('silence', '침묵', 'far', { motion: -.23, softness: .25, space: .18, tension: -.04 },
    '침묵 정적 무음 고요 조용 잠잠 적막 소리없이',
    'silence silent quiet hush mute soundless noiseless stillness'),
  concept('calm', '평온', 'near', { motion: -.23, softness: .27, space: .12, tension: -.1 },
    '평온 평화 편안 느긋 포근 부드러운 잔잔 천천히 쉬다 휴식 안심 온화 여유',
    'calm peaceful peace ease easy relaxed gentle soft smooth serene tranquil slow rest safe mild'),
  concept('joy', '기쁨', 'near', { warmth: .2, motion: .24, light: .15, tension: -.04 },
    '행복 기쁨 즐거 신나 웃 미소 설렘 반가 축하 환호 들뜬 유쾌 상쾌 희망 춤추 춤춘',
    'happy happiness joy joyful glad delight cheerful smile laugh laughter excited celebrate hooray hope hopeful'),
  concept('love', '사랑과 온기', 'near', { warmth: .31, softness: .19, light: .07, tension: -.05 },
    '사랑 좋아 다정 애정 연인 친구 가족 엄마 아빠 아이 아기 품 포옹 안아 입맞춤 온기 따뜻 포근 친절',
    'love loving lovely tender affection friend family mother father child baby hug embrace kiss warmth warm cozy kind kindness'),
  concept('sadness', '슬픔', 'near', { warmth: -.13, light: -.13, softness: .18, tension: .09, motion: -.07 },
    '슬픔 슬픈 서러 우울 외로 쓸쓸 눈물 그리움 아픔 이별 잃 잊힌 허전',
    'sad sadness sorrow blue lonely loneliness tear tears grief ache farewell loss lost empty melancholy'),
  concept('fear', '두려움', 'near', { tension: .33, warmth: -.13, light: -.12, softness: -.17, motion: .12 },
    '두려 무서 공포 불안 걱정 긴장 떨리 숨죽 위험 위태 악몽 비명',
    'fear afraid scared frightening horror anxious anxiety worry tense nervous tremble danger nightmare scream'),
  concept('anger', '격정', 'near', { tension: .34, warmth: .08, motion: .26, softness: -.28 },
    '화 분노 짜증 미움 격렬 거친 사나운 폭발 충돌 싸움 외침',
    'anger angry rage furious fierce rough explode explosion crash conflict fight shout'),
  concept('wonder', '경이', 'near', { light: .18, space: .15, tension: .03, softness: .05 },
    '경이 신비 놀라 궁금 상상 마법 비밀 기적 낯선 새로운 발견 모험 환상',
    'wonder awe amazing curious curiosity imagine imagination magic mystery secret miracle strange new discover adventure fantasy'),
  concept('dream', '꿈과 기억', 'far', { softness: .19, space: .2, motion: -.05, light: -.03 },
    '꿈 꿈결 몽상 잠 잠든 기억 추억 과거 옛날 그때 잊다 떠올리 회상 상상',
    'dream dreaming asleep sleep memory remember remembrance past once nostalgia recall reverie'),
  concept('playful', '놀이', 'near', { motion: .27, light: .11, warmth: .08, tension: -.05 },
    '놀이 놀다 장난 통통 빙글 톡톡 방울 까꿍 깡충 데굴데굴 간질 꼬물 반짝반짝 춤 게임 재미 우연',
    'play playful game fun funny joke bounce bubbly bubble pop wiggle giggle peekaboo tumble tickle dance chance'),
  concept('motion', '움직임', 'near', { motion: .32, space: .04 },
    '달리 뛰 날 날아 흐르 건너 건넌 걷 기어 오르 내리 헤엄 돌 회전 빠르 서두르 쫓 던지 흔들 움직 여행 떠나',
    'run running jump leap fly flying flow cross walk crawl climb fall descend swim spin rotate fast hurry chase throw shake move moving travel leave'),
  concept('stillness', '멈춤', 'far', { motion: -.28, space: .11, softness: .11 },
    '멈추 머물 기다리 서 있 앉 눕 가만히 느린 정지 그대로',
    'stop pause stay wait stand sit lie motionless frozen remain linger'),
  concept('touch', '촉감', 'near', { softness: .12, warmth: .07 },
    '손 손끝 손길 피부 살결 만지 닿다 쓰다듬 포개 잡다 쥐다 부드러 거칠 매끈 보드라운 폭신 단단 날카 끈적',
    'hand fingertip touch skin stroke hold grasp soft silky smooth fluffy hard sharp rough sticky texture'),
  concept('body', '몸과 호흡', 'near', { warmth: .08, motion: .09, softness: .06 },
    '몸 얼굴 눈 코 입 귀 머리 머리카락 어깨 팔 다리 발 걸음 심장 마음 가슴 숨 호흡 맥박 피',
    'body face eye nose mouth ear head hair shoulder arm leg foot step heart mind chest breath breathe pulse blood'),
  concept('time', '시간', 'far', { space: .15, motion: -.02 },
    '시간 순간 찰나 지금 오늘 어제 내일 오래 영원 처음 마지막 시작 끝 계절 해 시계 초 분',
    'time moment instant now today yesterday tomorrow long forever first last begin beginning end ending season year clock second minute'),
  concept('city', '도시', 'far', { motion: .2, tension: .1, light: .13, softness: -.12 },
    '도시 거리 골목 길 건물 빌딩 창문 계단 지붕 다리 터널 광장 시장 가게 집 방 문 벽 네온 신호등 사람 군중',
    'city street alley road building tower window stair roof bridge tunnel square market shop house room door wall neon traffic crowd people'),
  concept('machine', '기계와 전기', 'far', { motion: .2, tension: .13, light: .12, softness: -.19 },
    '기계 자동차 버스 기차 지하철 비행기 배 자전거 바퀴 엔진 모터 시계 로봇 컴퓨터 화면 픽셀 전기 전자 철 금속',
    'machine car bus train subway airplane ship bicycle wheel engine motor robot computer screen pixel electric electronic iron metal steel'),
  concept('color', '색', 'near', { light: .15, warmth: .04 },
    '색 색깔 빨강 붉은 주황 노랑 금빛 초록 연두 파랑 푸른 남색 보라 분홍 하양 흰색 회색 은빛 검정 알록달록',
    'color red crimson orange yellow gold golden green lime blue azure navy purple violet pink white gray grey silver black colorful'),
  concept('taste', '맛과 향', 'near', { warmth: .1, softness: .06 },
    '맛 향 냄새 달콤 단맛 쓴맛 짠맛 신맛 매운 향긋 커피 차 우유 꿀 사탕 과일 빵',
    'taste scent smell sweet sweetness bitter salty sour spicy fragrant coffee tea milk honey candy fruit bread'),
];

export const FAR_CUES = `
  먼 멀리 저편 너머 뒤 배경 바깥 위 아래 하늘 수평선 지평선 풍경 산맥 들판
  far distant afar beyond behind background outside above below horizon landscape
`.trim().split(/\s+/u);

export const NEAR_CUES = `
  나 내게 너 네게 우리 여기 앞 곁 손 눈 얼굴 숨 마음 목소리 걸음 작은 가까이 바로
  i me my you your we our here near nearby beside hand eye face breath heart voice step tiny small close through
`.trim().split(/\s+/u);

export const STOPWORDS = new Set(`
  a an the and or but if then than so is are am was were be been being to of in on at by for from with
  as it its this that these those there here who what when where why how into over under again very just
  은 는 이 가 을 를 의 와 과 에 에서 로 으로 도 만 한 그 저 것 수 좀 더 아주 너무 그리고 그러나 또는
`.trim().split(/\s+/u));

export const LEXICON_STATS = Object.freeze({
  concepts: CONCEPTS.length,
  korean: CONCEPTS.reduce((sum, item) => sum + item.words.ko.length, 0),
  english: CONCEPTS.reduce((sum, item) => sum + item.words.en.length, 0),
});
