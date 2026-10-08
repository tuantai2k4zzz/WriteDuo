import { TutorContext, TutorStructuredResponse } from '../tutor.interface';

export class LocalTutorGenerator {
  public static generateResponse(
    userMessage: string,
    context: TutorContext,
    depthMode: 'quick' | 'normal' | 'deep' = 'normal',
  ): TutorStructuredResponse {
    const msg = userMessage.toLowerCase().trim();
    const isViToEn = context.exerciseMode === 'vi_to_en';
    const targetEn = isViToEn ? context.referenceAnswer : context.sourceSentence;
    const targetVi = isViToEn ? context.sourceSentence : context.referenceAnswer;
    const tense = context.grammarTopic || 'Cấu trúc tự nhiên';

    // 1. Unrelated queries filter
    if (
      msg.includes('thời tiết') ||
      msg.includes('chính trị') ||
      msg.includes('lập trình') ||
      msg.includes('code') ||
      msg.includes('bitcoin') ||
      msg.includes('bóng đá')
    ) {
      return {
        answer:
          'Mình là **WriteDuo AI Tutor** — gia sư tiếng Anh đồng hành cùng bạn.\nHãy hỏi mình về câu, từ vựng hoặc ngữ pháp trong bài học này nhé!',
        keyPoint: 'Tập trung vào bài học tiếng Anh hiện tại.',
        explanationType: 'general',
        followUpSuggestions: [
          'Giải thích ngữ pháp câu này',
          'Từ vựng trọng tâm là gì?',
          'Cho tôi một gợi ý',
        ],
      };
    }

    // 2. Mini Quiz request
    if (
      msg.includes('bài tập') ||
      msg.includes('luyện thêm') ||
      msg.includes('quiz') ||
      msg.includes('test') ||
      msg.includes('thực hành')
    ) {
      const firstToken = context.tokens?.[0]?.text || 'this';
      return {
        answer: `### Thử thách phản xạ nhanh\nDưới đây là bài tập nhỏ được thiết kế riêng dựa trên cấu trúc ngữ pháp **${tense}** của câu hiện tại:`,
        keyPoint: `Luyện tập củng cố cấu trúc ${tense}.`,
        explanationType: 'quiz',
        miniQuiz: {
          question: `Chọn phương án phù hợp nhất cho câu sau:\n"They usually ___ their dog every morning."`,
          options: ['A. take ... for a walk', 'B. go ... for a walk', 'C. takes ... a walk'],
          correctOption: 'A',
          explanation: `Cấu trúc 'take someone/something for a walk' có nghĩa là dắt/đưa ai đó đi dạo. Với chủ ngữ 'They' ở thì Hiện tại đơn, động từ giữ nguyên mẫu là 'take'.`,
        },
        followUpSuggestions: [
          'Tại sao chọn A mà không chọn B?',
          'Giải thích cấu trúc take someone for a walk',
          'Cho tôi thêm ví dụ khác',
        ],
      };
    }

    // 3. User asks why their answer is wrong ("Tại sao sai?", "Câu của tôi sai ở đâu?")
    if (
      msg.includes('sai ở đâu') ||
      msg.includes('tại sao sai') ||
      msg.includes('vì sao sai') ||
      msg.includes('why wrong') ||
      msg.includes('sao lại sai')
    ) {
      const userAns = context.userAnswer || '';
      const mistakes = context.mistakes || [];

      if (!userAns) {
        return {
          answer: `### Bạn chưa gửi câu trả lời\nHãy nhập câu trả lời của bạn vào ô bên trái và nhấn **Kiểm tra câu trả lời**, sau đó mình sẽ phân tích chi tiết từng lỗi nhé!`,
          keyPoint: 'Nhập câu trả lời để AI phân tích lỗi.',
          explanationType: 'mistake',
          followUpSuggestions: ['Gợi ý cho tôi cách viết', 'Giải thích ngữ pháp câu này'],
        };
      }

      if (mistakes.length > 0) {
        const firstM = mistakes[0];
        return {
          answer: `### Vì sao câu chưa chuẩn?\nTrong câu của bạn, cụm **"${firstM.where}"** chưa chính xác vì: ${firstM.whyIncorrect}\n\n### Cách sửa chuẩn\n👉 Thay bằng: **"${firstM.relatedEnglish || firstM.howToFix}"**\n👉 Câu chuẩn: **"${targetEn}"**\n\n### Mẹo nhớ\n${firstM.howToFix || 'Chú ý trật tự từ và sự hoà hợp giữa chủ ngữ và động từ.'}`,
          keyPoint: firstM.whyIncorrect,
          explanationType: 'mistake',
          examples: [
            { en: targetEn, vi: targetVi },
          ],
          followUpSuggestions: [
            'Có cách viết nào khác không?',
            'Giải thích ngữ pháp câu này',
            'Cho tôi 1 bài tập luyện tập',
          ],
        };
      }

      return {
        answer: `### Phân tích câu trả lời của bạn\nCâu của bạn viết: *"\"${userAns}\""*\nCâu chuẩn đối chiếu: *"\"${targetEn}\""*\n\n### Điểm cần lưu ý\nHãy kiểm tra lại thì động từ (**${tense}**), trật tự từ ngữ và các mạo từ/giới từ kết nối để câu đạt độ tự nhiên cao nhất.`,
        keyPoint: `Đối chiếu với cấu trúc chuẩn: "${targetEn}"`,
        explanationType: 'mistake',
        followUpSuggestions: [
          'Giải thích chi tiết ngữ pháp',
          'Cho tôi mẹo nhớ cấu trúc này',
        ],
      };
    }

    // 4. Hints request before answering
    if (
      msg.includes('gợi ý') ||
      msg.includes('hint') ||
      msg.includes('làm sao viết') ||
      msg.includes('bắt đầu thế nào')
    ) {
      return {
        answer: `### 💡 Gợi ý tư duy (Không lộ đáp án)\n- **Thì câu:** Sử dụng **${tense}**.\n- **Khung cấu trúc:** Bắt đầu bằng [Chủ ngữ] ➔ [Động từ chính] ➔ [Bổ ngữ/Tân ngữ] ➔ [Thời gian/Địa điểm].\n- **Từ khóa:** Chú ý các từ: ${context.tokens?.slice(0, 3).map((t) => `\`${t.text}\``).join(', ') || 'trong câu'}.\n\n*Hãy tự ghép các từ trên theo cấu trúc S-V-O rồi nhấn gửi nhé!*`,
        keyPoint: `Tập trung vào cấu trúc S-V-O và thì ${tense}.`,
        explanationType: 'hint',
        isHintOnly: true,
        followUpSuggestions: [
          'Từ đầu tiên trong câu là gì?',
          'Giải thích thì này dùng như thế nào?',
          'Hiện đáp án tham khảo',
        ],
      };
    }

    // 5. Why "for" vs "since"
    if (msg.includes('for') && (msg.includes('since') || msg.includes('khoảng') || msg.includes('mốc'))) {
      return {
        answer: `### Vì sao?\n\`for\` dùng để nói về **KHOẢNG THỜI GIAN** (duration), còn \`since\` dùng với **MỐC BẮT ĐẦU** (starting point).\n\n### Trong câu này\nCụm từ chỉ thời gian trong câu là một khoảng kéo dài, do đó ta dùng \`for\` chứ không dùng \`since\`.\n\n### So sánh\n- \`for + duration\`: for 5 years, for two weeks, for 3 hours.\n- \`since + point in time\`: since 2020, since yesterday, since Monday.\n\n### Ví dụ\n- ✓ *I have lived here for five years.* (Tôi đã sống ở đây được 5 năm.)\n- ✓ *I have lived here since 2021.* (Tôi đã sống ở đây từ năm 2021.)\n- ✗ *I have lived here since 5 years.* (Sai vì 5 years là khoảng thời gian)\n\n### Mẹo nhớ\n**FOR = Khoảng** (đếm được số lượng: 1 ngày, 5 năm...)  \n**SINCE = Mốc** (chỉ thời điểm cụ thể: năm nào, thứ mấy...)`,
        keyPoint: 'FOR dùng với khoảng thời gian; SINCE dùng với mốc thời gian.',
        explanationType: 'comparison',
        comparison: {
          itemA: 'for + duration',
          itemB: 'since + point of time',
          difference: 'for tính tổng độ dài thời gian, since tính từ một mốc cố định trong quá khứ.',
        },
        examples: [
          { en: 'I have waited for two hours.', vi: 'Tôi đã đợi được hai tiếng rồi.' },
          { en: 'I have waited since 2 PM.', vi: 'Tôi đã đợi từ lúc 2 giờ chiều.' },
        ],
        followUpSuggestions: [
          'Cho tôi thêm ví dụ với since',
          'Tạo bài tập phân biệt for và since',
          'Câu của tôi dùng đúng chưa?',
        ],
      };
    }

    // 6. Why "take" vs "go" (take someone for a walk vs go for a walk)
    if (msg.includes('take') && (msg.includes('go') || msg.includes('tại sao') || msg.includes('vì sao'))) {
      return {
        answer: `### Vì sao?\nỞ đây dùng \`take\` vì cụm cố định là **\`take someone for a walk\`** = đưa/dắt ai đó đi dạo.\n\n### Trong câu này\nCâu có đối tượng được dẫn đi cùng, vì vậy cấu trúc bắt buộc là:\n\`take [đối tượng] for a walk\`.\n\n### So sánh\n- \`go for a walk\`: tự mình đi dạo (không nhận tân ngữ trực tiếp).\n- \`take someone for a walk\`: dắt hoặc đưa ai đó cùng đi dạo.\n\n### Ví dụ\n- ✓ *I go for a walk every morning.* (Tôi đi dạo mỗi sáng.)\n- ✓ *I take my dog for a walk every morning.* (Tôi dắt chó đi dạo mỗi sáng.)\n- ✗ *I go my dog for a walk.* (Sai cấu trúc)\n\n### Mẹo nhớ\n**GO = Mình tự đi**  \n**TAKE = Dắt ai đó đi cùng**`,
        keyPoint: 'take someone for a walk = dắt ai đi dạo; go for a walk = tự mình đi dạo.',
        explanationType: 'comparison',
        comparison: {
          itemA: 'take someone for a walk',
          itemB: 'go for a walk',
          difference: 'take nhận tân ngữ người/vật; go không nhận tân ngữ trực tiếp.',
        },
        examples: [
          { en: 'He takes his puppy for a walk.', vi: 'Cậu ấy dắt cún con đi dạo.' },
          { en: 'She goes for a walk after dinner.', vi: 'Cô ấy đi dạo sau bữa tối.' },
        ],
        followUpSuggestions: [
          'Cho tôi 1 bài tập về take và go',
          'Trong câu này có từ vựng nào hay nữa không?',
        ],
      };
    }

    // 7. Word meaning in context (e.g., "annoying nghĩa là gì?", "annoying vs annoyed")
    const matchedToken = context.tokens?.find((t) => msg.includes(t.text.toLowerCase()));
    if (matchedToken || msg.includes('nghĩa là gì') || msg.includes('từ này')) {
      const token = matchedToken || context.tokens?.[0] || {
        text: 'từ này',
        pos: 'word',
        ipa: '',
        meaningVi: 'nghĩa trong câu',
        lemma: '',
      };

      const isAnnoying = token.text.toLowerCase().includes('annoy');

      return {
        answer: `### Trong câu này\nTừ **\`${token.text}\`** mang nghĩa: **${token.meaningVi || 'ngữ cảnh tự nhiên'}**.\n- Từ loại: *${token.pos || 'từ'}*\n${token.ipa ? `- Phiên âm IPA: \`${token.ipa}\`\n` : ''}\n\n### Bản chất và sắc thái\n${
          isAnnoying
            ? '`annoying` (đuôi -ing) diễn tả tính chất của sự vật/sự việc gây khó chịu cho người khác. Khác với `annoyed` (đuôi -ed) chỉ cảm xúc của người cảm thấy khó chịu.'
            : `Đóng vai trò là ${token.pos} trong câu, kết nối chặt chẽ với các thành phần xung quanh để tạo nên nghĩa hoàn chỉnh.`
        }\n\n### Ví dụ\n- *This word fits naturally in modern English.* (Từ này được dùng rất tự nhiên trong tiếng Anh hiện đại.)\n${
          isAnnoying
            ? '- *The noise is annoying.* (Tiếng ồn rất khó chịu.)\n- *I feel annoyed.* (Tôi cảm thấy khó chịu.)'
            : ''
        }\n\n### Mẹo nhớ\nNhớ từ theo cả cụm trong câu: **"${targetEn}"**.`,
        keyPoint: `"${token.text}" = ${token.meaningVi || 'nghĩa theo ngữ cảnh trong câu'}.`,
        explanationType: 'vocabulary',
        relatedVocabulary: [
          {
            word: token.text,
            pos: token.pos,
            ipa: token.ipa,
            meaningInContext: token.meaningVi || 'Nghĩa ngữ cảnh',
          },
        ],
        followUpSuggestions: [
          `Từ "${token.text}" có gia đình từ nào khác không?`,
          'Giải thích thêm ngữ pháp của câu',
          'Cho tôi làm bài tập',
        ],
      };
    }

    // 8. Tense explanation (e.g., "Tại sao dùng thì này?", "Tại sao là Present Simple / Present Perfect?")
    if (msg.includes('thì') || msg.includes('tense') || msg.includes('present') || msg.includes('past')) {
      return {
        answer: `### Vì sao dùng thì ${tense}?\nThì **${tense}** được dùng vì câu đang diễn đạt: ${context.grammarExplanation || 'sự việc hoặc trạng thái chuẩn xác theo ngữ cảnh bài học'}.\n\n### Trong câu này\nCâu tiếng Anh: **"${targetEn}"**\nCấu trúc này thể hiện tính chính xác về mặt thời gian và sắc thái hành động của chủ ngữ.\n\n### Ví dụ tương tự\n- *They practice English every day.* (Thói quen lặp đi lặp lại)\n- *She understands the grammar rule now.* (Nhận thức ở hiện tại)\n\n### Mẹo nhớ\nQuan sát các trạng từ chỉ thời gian hoặc bản chất hành động để xác định thì chuẩn xác nhất!`,
        keyPoint: `Thì ${tense} thể hiện chính xác bản chất thời gian của hành động.`,
        explanationType: 'grammar',
        grammarPoint: tense,
        examples: [
          { en: targetEn, vi: targetVi },
        ],
        followUpSuggestions: [
          'Dấu hiệu nhận biết thì này là gì?',
          'Nếu đổi sang thì khác thì câu sẽ thế nào?',
          'Tạo bài tập về thì này',
        ],
      };
    }

    // 9. General pedagogical explanation
    return {
      answer: `### Vì sao câu lại viết như vậy?\nTrong câu: **"${targetEn}"**  \nBản dịch: *"${targetVi}"*\n\n### Trọng tâm ngữ pháp\n- **Thì câu:** ${tense}.\n- **Trật tự:** Chủ ngữ + Động từ + Bổ ngữ (S-V-O) tuân thủ tính tự nhiên trong giao tiếp tiếng Anh hiện đại.\n- **Từ vựng nổi bật:** ${context.tokens?.slice(0, 3).map((t) => `\`${t.text}\` (${t.meaningVi || t.pos})`).join(', ') || 'các từ trong câu'}.\n\n### Mẹo nhớ\nKhông nên dịch từng từ một (word-by-word) mà hãy nắm cấu trúc cả cụm để diễn đạt chuẩn phong cách người bản xứ!`,
      keyPoint: `Câu tuân theo cấu trúc S-V-O với thì ${tense}.`,
      explanationType: 'why',
      examples: [
        { en: targetEn, vi: targetVi },
      ],
      followUpSuggestions: [
        'Vì sao dùng từ này mà không dùng từ khác?',
        'Câu của tôi viết thế này có đúng không?',
        'Cho tôi bài tập luyện tập',
      ],
    };
  }
}
