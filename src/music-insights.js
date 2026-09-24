import { createArrangement } from './music-engine.js';
import { createModularPatch } from './modular-patch.js';

export function musicInsights(analysis, beat) {
  const arrangement = createArrangement(analysis, beat);
  const patch = createModularPatch(analysis);
  const emotional = [...new Set(analysis.tokenMeanings.filter((word) => word.conceptIds.some((id) => ['fear', 'anger', 'sadness'].includes(id))).map((word) => word.token))];
  const rows = [
    [`${analysis.root} ${arrangement.scale} · ${arrangement.bpm} BPM`, emotional.length
      ? `‘${emotional.join(' · ')}’을 슬픔·두려움·분노 계열로 해석해 단조를 선택했어요. 문맥에 따라 이 해석은 다를 수 있어요.${arrangement.tension ? ' 긴장감은 더 날카로운 음색과 짧은 여운으로 반영됩니다.' : ''}`
      : '첫 단어가 조성의 기준이 되고, 문장 전체의 움직임이 빠르기를 정합니다.'],
    ['단어를 쌓으면 소리도 쌓여요', `${analysis.tokens.length}개 단어로 구성한 소리: ${[
      patch.modules.length > 1 ? `${patch.modules.length}개 문장 선율` : '선율',
      analysis.tokens.length >= 2 ? '화음' : '', analysis.tokens.length >= 3 ? '베이스' : '',
      analysis.tokens.length >= 6 ? '보조 선율' : '', arrangement.drums > 0 ? '비트' : '',
      arrangement.relationGain ? '응답 선율' : '',
    ].filter(Boolean).join(' · ')}.`],
    [patch.cables.length ? `${patch.cables.length}개의 문장 패치` : '문장을 이어서 써보세요', patch.cables.length
      ? `앞 문장이 뒤 문장의 ${[...new Set(patch.cables.map((cable) => ({cutoff:'필터',gate:'발음 타이밍',pitch:'음높이'})[cable.kind]))].join(' · ')}에 영향을 줍니다. 코드의 PATCH에서 실제 신호 방향을 볼 수 있어요.`
      : '두 번째 문장을 더하면 별도 선율이 생기고, 앞 문장의 느린 파동이 다음 문장의 필터를 움직입니다.'],
  ];
  return rows;
}
