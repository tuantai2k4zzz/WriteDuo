export interface DictionaryEntry {
  meaningVi: string;
  ipa: string;
  pos: string;
  cefr: string;
  exampleEn?: string;
  exampleVi?: string;
}

export const COMMON_DICTIONARY: Record<string, DictionaryEntry> = {
  // Grammar & Function Words
  'i': { meaningVi: 'tôi', ipa: '/aɪ/', pos: 'pronoun', cefr: 'A1' },
  'you': { meaningVi: 'bạn, các bạn', ipa: '/juː/', pos: 'pronoun', cefr: 'A1' },
  'he': { meaningVi: 'anh ấy, nó, cậu ấy', ipa: '/hiː/', pos: 'pronoun', cefr: 'A1' },
  'she': { meaningVi: 'cô ấy, bà ấy', ipa: '/ʃiː/', pos: 'pronoun', cefr: 'A1' },
  'it': { meaningVi: 'nó, điều đó', ipa: '/ɪt/', pos: 'pronoun', cefr: 'A1' },
  'we': { meaningVi: 'chúng tôi, chúng ta', ipa: '/wiː/', pos: 'pronoun', cefr: 'A1' },
  'they': { meaningVi: 'họ, chúng nó', ipa: '/ðeɪ/', pos: 'pronoun', cefr: 'A1' },
  'me': { meaningVi: 'tôi (tân ngữ)', ipa: '/miː/', pos: 'pronoun', cefr: 'A1' },
  'him': { meaningVi: 'anh ấy (tân ngữ)', ipa: '/hɪm/', pos: 'pronoun', cefr: 'A1' },
  'her': { meaningVi: 'cô ấy, của cô ấy', ipa: '/hɜːr/', pos: 'pronoun', cefr: 'A1' },
  'us': { meaningVi: 'chúng tôi (tân ngữ)', ipa: '/ʌs/', pos: 'pronoun', cefr: 'A1' },
  'them': { meaningVi: 'họ (tân ngữ)', ipa: '/ðem/', pos: 'pronoun', cefr: 'A1' },
  'my': { meaningVi: 'của tôi', ipa: '/maɪ/', pos: 'pronoun', cefr: 'A1' },
  'your': { meaningVi: 'của bạn', ipa: '/jɔːr/', pos: 'pronoun', cefr: 'A1' },
  'his': { meaningVi: 'của anh ấy', ipa: '/hɪz/', pos: 'pronoun', cefr: 'A1' },
  'their': { meaningVi: 'của họ', ipa: '/ðeər/', pos: 'pronoun', cefr: 'A1' },
  'our': { meaningVi: 'của chúng tôi', ipa: '/aʊər/', pos: 'pronoun', cefr: 'A1' },
  'its': { meaningVi: 'của nó', ipa: '/ɪts/', pos: 'pronoun', cefr: 'A1' },
  'a': { meaningVi: 'một', ipa: '/ə/', pos: 'article', cefr: 'A1' },
  'an': { meaningVi: 'một', ipa: '/æn/', pos: 'article', cefr: 'A1' },
  'the': { meaningVi: 'cái, con (mạo từ xác định)', ipa: '/ðə/', pos: 'article', cefr: 'A1' },
  'this': { meaningVi: 'cái này, điều này', ipa: '/ðɪs/', pos: 'determiner', cefr: 'A1' },
  'that': { meaningVi: 'cái đó, điều đó', ipa: '/ðæt/', pos: 'determiner', cefr: 'A1' },
  'these': { meaningVi: 'những cái này', ipa: '/ðiːz/', pos: 'determiner', cefr: 'A1' },
  'those': { meaningVi: 'những cái đó', ipa: '/ðəʊz/', pos: 'determiner', cefr: 'A1' },
  'is': { meaningVi: 'thì, là, ở', ipa: '/ɪz/', pos: 'verb', cefr: 'A1' },
  'are': { meaningVi: 'thì, là, ở (số nhiều)', ipa: '/ɑːr/', pos: 'verb', cefr: 'A1' },
  'am': { meaningVi: 'thì, là (ngôi I)', ipa: '/æm/', pos: 'verb', cefr: 'A1' },
  'was': { meaningVi: 'đã là, đã ở', ipa: '/wɒz/', pos: 'verb', cefr: 'A1' },
  'were': { meaningVi: 'đã là, đã ở (số nhiều)', ipa: '/wɜːr/', pos: 'verb', cefr: 'A1' },
  'be': { meaningVi: 'thì, là, ở, trở thành', ipa: '/biː/', pos: 'verb', cefr: 'A1' },
  'been': { meaningVi: 'đã từng, đã ở', ipa: '/biːn/', pos: 'verb', cefr: 'A1' },
  'being': { meaningVi: 'đang là, bản thể', ipa: '/ˈbiː.ɪŋ/', pos: 'verb', cefr: 'A2' },
  'have': { meaningVi: 'có, sở hữu', ipa: '/hæv/', pos: 'verb', cefr: 'A1' },
  'has': { meaningVi: 'có (ngôi thứ ba số ít)', ipa: '/hæz/', pos: 'verb', cefr: 'A1' },
  'had': { meaningVi: 'đã có', ipa: '/hæd/', pos: 'verb', cefr: 'A1' },
  'do': { meaningVi: 'làm, hành động', ipa: '/duː/', pos: 'verb', cefr: 'A1' },
  'does': { meaningVi: 'làm (ngôi ba số ít)', ipa: '/dʌz/', pos: 'verb', cefr: 'A1' },
  'did': { meaningVi: 'đã làm', ipa: '/dɪd/', pos: 'verb', cefr: 'A1' },
  'and': { meaningVi: 'và', ipa: '/ænd/', pos: 'conjunction', cefr: 'A1' },
  'but': { meaningVi: 'nhưng', ipa: '/bʌt/', pos: 'conjunction', cefr: 'A1' },
  'or': { meaningVi: 'hoặc, hay', ipa: '/ɔːr/', pos: 'conjunction', cefr: 'A1' },
  'so': { meaningVi: 'vì vậy, cho nên', ipa: '/səʊ/', pos: 'conjunction', cefr: 'A1' },
  'because': { meaningVi: 'bởi vì', ipa: '/bɪˈkɒz/', pos: 'conjunction', cefr: 'A1' },
  'if': { meaningVi: 'nếu, liệu rằng', ipa: '/ɪf/', pos: 'conjunction', cefr: 'A1' },
  'when': { meaningVi: 'khi, lúc', ipa: '/wen/', pos: 'conjunction', cefr: 'A1' },
  'where': { meaningVi: 'nơi mà, ở đâu', ipa: '/weər/', pos: 'conjunction', cefr: 'A1' },
  'which': { meaningVi: 'cái mà, cái nào', ipa: '/wɪtʃ/', pos: 'pronoun', cefr: 'A1' },
  'who': { meaningVi: 'người mà, ai', ipa: '/huː/', pos: 'pronoun', cefr: 'A1' },
  'whose': { meaningVi: 'của ai, của người mà', ipa: '/huːz/', pos: 'pronoun', cefr: 'A2' },
  'whom': { meaningVi: 'người mà (tân ngữ)', ipa: '/huːm/', pos: 'pronoun', cefr: 'B1' },
  'that_conj': { meaningVi: 'rằng, người/vật mà', ipa: '/ðæt/', pos: 'conjunction', cefr: 'A1' },
  'in': { meaningVi: 'trong, ở trong', ipa: '/ɪn/', pos: 'preposition', cefr: 'A1' },
  'on': { meaningVi: 'trên, ở trên', ipa: '/ɒn/', pos: 'preposition', cefr: 'A1' },
  'at': { meaningVi: 'tại, ở', ipa: '/æt/', pos: 'preposition', cefr: 'A1' },
  'to': { meaningVi: 'đến, để, hướng tới', ipa: '/tuː/', pos: 'preposition', cefr: 'A1' },
  'for': { meaningVi: 'cho, dành cho, vì', ipa: '/fɔːr/', pos: 'preposition', cefr: 'A1' },
  'with': { meaningVi: 'với, cùng với', ipa: '/wɪð/', pos: 'preposition', cefr: 'A1' },
  'from': { meaningVi: 'từ, bắt nguồn từ', ipa: '/frɒm/', pos: 'preposition', cefr: 'A1' },
  'by': { meaningVi: 'bởi, bằng cách', ipa: '/baɪ/', pos: 'preposition', cefr: 'A1' },
  'about': { meaningVi: 'về, khoảng chừng', ipa: '/əˈbaʊt/', pos: 'preposition', cefr: 'A1' },
  'as': { meaningVi: 'như là, khi, vì', ipa: '/æz/', pos: 'preposition', cefr: 'A1' },
  'into': { meaningVi: 'vào trong', ipa: '/ˈɪn.tuː/', pos: 'preposition', cefr: 'A1' },
  'through': { meaningVi: 'qua, xuyên qua', ipa: '/θruː/', pos: 'preposition', cefr: 'A2' },
  'between': { meaningVi: 'giữa (hai đối tượng)', ipa: '/bɪˈtwiːn/', pos: 'preposition', cefr: 'A1' },
  'among': { meaningVi: 'giữa (nhiều đối tượng)', ipa: '/əˈmʌŋ/', pos: 'preposition', cefr: 'B1' },
  'toward': { meaningVi: 'hướng tới, về phía', ipa: '/təˈwɔːdz/', pos: 'preposition', cefr: 'B1' },
  'towards': { meaningVi: 'hướng về, đối với', ipa: '/təˈwɔːdz/', pos: 'preposition', cefr: 'B1' },
  'without': { meaningVi: 'không có, thiếu', ipa: '/wɪˈðaʊt/', pos: 'preposition', cefr: 'A2' },
  'under': { meaningVi: 'dưới, ở dưới', ipa: '/ˈʌn.dər/', pos: 'preposition', cefr: 'A1' },
  'over': { meaningVi: 'qua, trên, kết thúc', ipa: '/ˈəʊ.vər/', pos: 'preposition', cefr: 'A1' },

  // Workplace, Conflict, Communication & Professional Life (Crucial for Reading 20 & B1-B2)
  'conflict': { meaningVi: 'xung đột, mâu thuẫn', ipa: '/ˈkɒn.flɪkt/', pos: 'noun', cefr: 'B2', exampleEn: 'Workplace conflict can be resolved with open dialogue.', exampleVi: 'Xung đột nơi làm việc có thể được giải quyết bằng đối thoại cởi mở.' },
  'conflicts': { meaningVi: 'các cuộc xung đột, mối bất đồng', ipa: '/ˈkɒn.flɪkts/', pos: 'noun', cefr: 'B2' },
  'inevitable': { meaningVi: 'không thể tránh khỏi, tất yếu', ipa: '/ɪnˈev.ɪ.tə.bəl/', pos: 'adjective', cefr: 'B2', exampleEn: 'Change is inevitable.', exampleVi: 'Thay đổi là điều không thể tránh khỏi.' },
  'feature': { meaningVi: 'đặc điểm, nét đặc trưng', ipa: '/ˈfiː.tʃər/', pos: 'noun', cefr: 'B1' },
  'workplace': { meaningVi: 'nơi làm việc, công sở', ipa: '/ˈwɜːk.pleɪs/', pos: 'noun', cefr: 'B1', exampleEn: 'A healthy workplace promotes teamwork.', exampleVi: 'Nơi làm việc lành mạnh thúc đẩy tinh thần đồng đội.' },
  'background': { meaningVi: 'nền tảng, xuất thân, bối cảnh', ipa: '/ˈbæk.ɡraʊnd/', pos: 'noun', cefr: 'B1', exampleEn: 'Employees come from diverse backgrounds.', exampleVi: 'Các nhân viên đến từ nhiều nền tảng khác nhau.' },
  'backgrounds': { meaningVi: 'nền tảng, hoàn cảnh xuất thân, bối cảnh', ipa: '/ˈbæk.ɡraʊndz/', pos: 'noun', cefr: 'B1', exampleEn: 'People from different backgrounds bring fresh ideas.', exampleVi: 'Những người từ các hoàn cảnh xuất thân khác nhau mang lại ý tưởng mới mẻ.' },
  'diverse': { meaningVi: 'đa dạng, phong phú', ipa: '/daɪˈvɜːs/', pos: 'adjective', cefr: 'B2' },
  'different': { meaningVi: 'khác biệt, đa dạng', ipa: '/ˈdɪf.ər.ənt/', pos: 'adjective', cefr: 'A1' },
  'communication': { meaningVi: 'sự giao tiếp, truyền thông', ipa: '/kəˌmjuː.nɪˈkeɪ.ʃən/', pos: 'noun', cefr: 'B1' },
  'communicate': { meaningVi: 'giao tiếp, trao đổi', ipa: '/kəˈmjuː.nɪ.keɪt/', pos: 'verb', cefr: 'B1' },
  'style': { meaningVi: 'phong cách, kiểu cách', ipa: '/staɪl/', pos: 'noun', cefr: 'A2' },
  'styles': { meaningVi: 'các phong cách, lối', ipa: '/staɪlz/', pos: 'noun', cefr: 'A2' },
  'priority': { meaningVi: 'sự ưu tiên, quyền ưu tiên', ipa: '/praɪˈɒr.ə.ti/', pos: 'noun', cefr: 'B2' },
  'priorities': { meaningVi: 'các sự ưu tiên, thứ tự ưu tiên', ipa: '/praɪˈɒr.ə.tiz/', pos: 'noun', cefr: 'B2' },
  'professional': { meaningVi: 'chuyên nghiệp, nghề nghiệp', ipa: '/prəˈfeʃ.ən.əl/', pos: 'adjective', cefr: 'B1' },
  'interest': { meaningVi: 'lợi ích, mối quan tâm, sở thích', ipa: '/ˈɪn.trəst/', pos: 'noun', cefr: 'B1' },
  'interests': { meaningVi: 'các lợi ích, mối quan tâm', ipa: '/ˈɪn.trəsts/', pos: 'noun', cefr: 'B1' },
  'shared': { meaningVi: 'chung, được chia sẻ', ipa: '/ʃeəd/', pos: 'adjective', cefr: 'B1' },
  'share': { meaningVi: 'chia sẻ', ipa: '/ʃeər/', pos: 'verb', cefr: 'A2' },
  'goal': { meaningVi: 'mục tiêu, đích đến', ipa: '/ɡəʊl/', pos: 'noun', cefr: 'A2' },
  'goals': { meaningVi: 'các mục tiêu, mục đích', ipa: '/ɡəʊlz/', pos: 'noun', cefr: 'A2' },
  'critical': { meaningVi: 'then chốt, quan trọng, phản biện', ipa: '/ˈkrɪt.ɪ.kəl/', pos: 'adjective', cefr: 'B2' },
  'variable': { meaningVi: 'biến số, yếu tố thay đổi', ipa: '/ˈveə.ri.ə.bəl/', pos: 'noun', cefr: 'B2' },
  'occur': { meaningVi: 'xảy ra, xuất hiện', ipa: '/əˈkɜːr/', pos: 'verb', cefr: 'B1' },
  'occurs': { meaningVi: 'xảy ra, phát sinh', ipa: '/əˈkɜːz/', pos: 'verb', cefr: 'B1' },
  'recognize': { meaningVi: 'nhận biết, công nhận', ipa: '/ˈrek.əɡ.naɪz/', pos: 'verb', cefr: 'B1' },
  'recognized': { meaningVi: 'được nhận thức, được ghi nhận', ipa: '/ˈrek.əɡ.naɪzd/', pos: 'verb', cefr: 'B1' },
  'manage': { meaningVi: 'quản lý, giải quyết', ipa: '/ˈmæn.ɪdʒ/', pos: 'verb', cefr: 'B1' },
  'managed': { meaningVi: 'được quản lý, xoay xở', ipa: '/ˈmæn.ɪdʒd/', pos: 'verb', cefr: 'B1' },
  'handle': { meaningVi: 'xử lý, ứng phó', ipa: '/ˈhæn.dəl/', pos: 'verb', cefr: 'B1' },
  'handled': { meaningVi: 'được xử lý, giải quyết', ipa: '/ˈhæn.dəld/', pos: 'verb', cefr: 'B1' },
  'poorly': { meaningVi: 'kém, tồi tệ, không tốt', ipa: '/ˈpɔː.li/', pos: 'adverb', cefr: 'B1' },
  'reduce': { meaningVi: 'giảm bớt, cắt giảm', ipa: '/rɪˈdjuːs/', pos: 'verb', cefr: 'B1' },
  'reduces': { meaningVi: 'làm giảm bớt', ipa: '/rɪˈdjuː.sɪz/', pos: 'verb', cefr: 'B1' },
  'productivity': { meaningVi: 'năng suất lao động', ipa: '/ˌprɒd.ʌkˈtɪv.ə.ti/', pos: 'noun', cefr: 'B2' },
  'damage': { meaningVi: 'gây tổn hại, làm hư hại', ipa: '/ˈdæm.ɪdʒ/', pos: 'verb', cefr: 'B1' },
  'damages': { meaningVi: 'làm tổn hại', ipa: '/ˈdæm.ɪ.dʒɪz/', pos: 'verb', cefr: 'B1' },
  'relationship': { meaningVi: 'mối quan hệ', ipa: '/rɪˈleɪ.ʃən.ʃɪp/', pos: 'noun', cefr: 'B1' },
  'relationships': { meaningVi: 'các mối quan hệ', ipa: '/rɪˈleɪ.ʃən.ʃɪps/', pos: 'noun', cefr: 'B1' },
  'increase': { meaningVi: 'tăng lên, gia tăng', ipa: '/ɪnˈkriːs/', pos: 'verb', cefr: 'B1' },
  'increases': { meaningVi: 'làm gia tăng', ipa: '/ɪnˈkriː.sɪz/', pos: 'verb', cefr: 'B1' },
  'staff': { meaningVi: 'đội ngũ nhân viên', ipa: '/stɑːf/', pos: 'noun', cefr: 'A2' },
  'turnover': { meaningVi: 'tỷ lệ nghỉ việc, doanh số', ipa: '/ˈtɜːnˌəʊ.vər/', pos: 'noun', cefr: 'B2' },
  'expose': { meaningVi: 'đặt vào rủi ro, phơi bày', ipa: '/ɪkˈspəʊz/', pos: 'verb', cefr: 'B2' },
  'organization': { meaningVi: 'tổ chức, cơ quan', ipa: '/ˌɔː.ɡən.aɪˈzeɪ.ʃən/', pos: 'noun', cefr: 'B1' },
  'organizations': { meaningVi: 'các tổ chức', ipa: '/ˌɔː.ɡən.aɪˈzeɪ.ʃənz/', pos: 'noun', cefr: 'B1' },
  'legal': { meaningVi: 'pháp lý, hợp pháp', ipa: '/ˈliː.ɡəl/', pos: 'adjective', cefr: 'B1' },
  'liability': { meaningVi: 'trách nhiệm pháp lý, nghĩa vụ', ipa: '/ˌlaɪ.əˈbɪl.ə.ti/', pos: 'noun', cefr: 'B2' },
  'escalate': { meaningVi: 'leo thang, trở nên gay gắt hơn', ipa: '/ˈes.kə.leɪt/', pos: 'verb', cefr: 'B2' },
  'escalates': { meaningVi: 'leo thang', ipa: '/ˈes.kə.leɪts/', pos: 'verb', cefr: 'B2' },
  'escalated': { meaningVi: 'đã leo thang', ipa: '/ˈes.kə.leɪ.tɪd/', pos: 'verb', cefr: 'B2' },
  'unaddressed': { meaningVi: 'chưa được giải quyết, bỏ qua', ipa: '/ˌʌn.əˈdrest/', pos: 'adjective', cefr: 'C1' },
  'effective': { meaningVi: 'hiệu quả, có tác dụng', ipa: '/ɪˈfek.tɪv/', pos: 'adjective', cefr: 'B1' },
  'resolution': { meaningVi: 'sự giải quyết, nghị quyết', ipa: '/ˌrez.əˈluː.ʃən/', pos: 'noun', cefr: 'B2' },
  'negotiation': { meaningVi: 'sự đàm phán, thương lượng', ipa: '/nəˌɡəʊ.ʃiˈeɪ.ʃən/', pos: 'noun', cefr: 'B2' },
  'mediation': { meaningVi: 'sự hòa giải', ipa: '/ˌmiː.diˈeɪ.ʃən/', pos: 'noun', cefr: 'C1' },
  'dialogue': { meaningVi: 'cuộc đối thoại', ipa: '/ˈdaɪ.ə.lɒɡ/', pos: 'noun', cefr: 'B1' },
  'grievance': { meaningVi: 'khiếu nại, bức xúc', ipa: '/ˈɡriː.vəns/', pos: 'noun', cefr: 'C1' },
  'strategy': { meaningVi: 'chiến lược', ipa: '/ˈstræt.ə.dʒi/', pos: 'noun', cefr: 'B1' },
  'strategies': { meaningVi: 'các chiến lược', ipa: '/ˈstræt.ə.dʒiz/', pos: 'noun', cefr: 'B1' },
  'colleague': { meaningVi: 'đồng nghiệp', ipa: '/ˈkɒl.iːɡ/', pos: 'noun', cefr: 'A2' },
  'colleagues': { meaningVi: 'các đồng nghiệp', ipa: '/ˈkɒl.iːɡz/', pos: 'noun', cefr: 'A2' },
  'manager': { meaningVi: 'người quản lý', ipa: '/ˈmæn.ɪ.dʒər/', pos: 'noun', cefr: 'A2' },
  'feedback': { meaningVi: 'phản hồi, ý kiến đóng góp', ipa: '/ˈfiːd.bæk/', pos: 'noun', cefr: 'B1' },
  'performance': { meaningVi: 'hiệu suất công việc, màn trình diễn', ipa: '/pəˈfɔː.məns/', pos: 'noun', cefr: 'B1' },
  'productivity_b1': { meaningVi: 'năng suất', ipa: '/ˌprɒd.ʌkˈtɪv.ə.ti/', pos: 'noun', cefr: 'B1' },
  'remote': { meaningVi: 'từ xa, hẻo lánh', ipa: '/rɪˈməʊt/', pos: 'adjective', cefr: 'B1' },
  'customer': { meaningVi: 'khách hàng', ipa: '/ˈkʌs.tə.mər/', pos: 'noun', cefr: 'A1' },
  'customers': { meaningVi: 'các khách hàng', ipa: '/ˈkʌs.tə.məz/', pos: 'noun', cefr: 'A1' },
  'service': { meaningVi: 'dịch vụ, sự phục vụ', ipa: '/ˈsɜː.vɪs/', pos: 'noun', cefr: 'A2' },
  'services': { meaningVi: 'các dịch vụ', ipa: '/ˈsɜː.vɪ.sɪz/', pos: 'noun', cefr: 'A2' },
  'excellence': { meaningVi: 'sự xuất sắc, ưu tú', ipa: '/ˈek.səl.əns/', pos: 'noun', cefr: 'B2' },

  // Daily Life, Beginner (Reading 1-5, A1-A2)
  'dog': { meaningVi: 'chú chó, con chó', ipa: '/dɔːɡ/', pos: 'noun', cefr: 'A1' },
  'dogs': { meaningVi: 'những chú chó', ipa: '/dɔːɡz/', pos: 'noun', cefr: 'A1' },
  'named': { meaningVi: 'được đặt tên là', ipa: '/neɪmd/', pos: 'verb', cefr: 'A1' },
  'friendly': { meaningVi: 'thân thiện, hiền lành', ipa: '/ˈfrendli/', pos: 'adjective', cefr: 'A1' },
  'play': { meaningVi: 'chơi đùa', ipa: '/pleɪ/', pos: 'verb', cefr: 'A1' },
  'morning': { meaningVi: 'buổi sáng', ipa: '/ˈmɔːnɪŋ/', pos: 'noun', cefr: 'A1' },
  'wake': { meaningVi: 'thức giấc', ipa: '/weɪk/', pos: 'verb', cefr: 'A1' },
  'wakes': { meaningVi: 'đánh thức', ipa: '/weɪks/', pos: 'verb', cefr: 'A1' },
  'face': { meaningVi: 'khuôn mặt', ipa: '/feɪs/', pos: 'noun', cefr: 'A1' },
  'funny': { meaningVi: 'buồn cười, vui vẻ', ipa: '/ˈfʌni/', pos: 'adjective', cefr: 'A1' },
  'annoying': { meaningVi: 'phiền toái, khó chịu', ipa: '/əˈnɔɪɪŋ/', pos: 'adjective', cefr: 'B1' },
  'park': { meaningVi: 'công viên', ipa: '/pɑːk/', pos: 'noun', cefr: 'A1' },
  'house': { meaningVi: 'ngôi nhà', ipa: '/haʊs/', pos: 'noun', cefr: 'A1' },
  'home': { meaningVi: 'mái ấm, gia đình', ipa: '/həʊm/', pos: 'noun', cefr: 'A1' },
  'fast': { meaningVi: 'nhanh chóng', ipa: '/fɑːst/', pos: 'adverb', cefr: 'A1' },
  'chase': { meaningVi: 'đuổi theo, săn đuổi', ipa: '/tʃeɪs/', pos: 'verb', cefr: 'A2' },
  'food': { meaningVi: 'thức ăn, đồ ăn', ipa: '/fuːd/', pos: 'noun', cefr: 'A1' },
  'eat': { meaningVi: 'ăn', ipa: '/iːt/', pos: 'verb', cefr: 'A1' },
  'eats': { meaningVi: 'ăn (ngôi ba)', ipa: '/iːts/', pos: 'verb', cefr: 'A1' },
  'family': { meaningVi: 'gia đình', ipa: '/ˈfæm.əl.i/', pos: 'noun', cefr: 'A1' },
  'sleep': { meaningVi: 'ngủ', ipa: '/sliːp/', pos: 'verb', cefr: 'A1' },
  'sleeps': { meaningVi: 'ngủ', ipa: '/sliːps/', pos: 'verb', cefr: 'A1' },
  'learn': { meaningVi: 'học, tiếp thu kiến thức', ipa: '/lɜːn/', pos: 'verb', cefr: 'A1' },
  'learning': { meaningVi: 'việc học tập', ipa: '/ˈlɜː.nɪŋ/', pos: 'noun', cefr: 'A1' },
  'practice': { meaningVi: 'luyện tập, thực hành', ipa: '/ˈpræk.tɪs/', pos: 'verb', cefr: 'A1' },
  'practiced': { meaningVi: 'đã luyện tập', ipa: '/ˈpræk.tɪst/', pos: 'verb', cefr: 'A1' },
  'book': { meaningVi: 'sách, cuốn sách', ipa: '/bʊk/', pos: 'noun', cefr: 'A1' },
  'books': { meaningVi: 'những cuốn sách', ipa: '/bʊks/', pos: 'noun', cefr: 'A1' },
  'friend': { meaningVi: 'người bạn', ipa: '/frend/', pos: 'noun', cefr: 'A1' },
  'friends': { meaningVi: 'những người bạn', ipa: '/frendz/', pos: 'noun', cefr: 'A1' },
  'people': { meaningVi: 'mọi người, con người', ipa: '/ˈpiː.pəl/', pos: 'noun', cefr: 'A1' },
  'work': { meaningVi: 'làm việc, công việc', ipa: '/wɜːk/', pos: 'verb', cefr: 'A1' },
  'time': { meaningVi: 'thời gian, thời điểm', ipa: '/taɪm/', pos: 'noun', cefr: 'A1' },
  'year': { meaningVi: 'năm', ipa: '/jɪər/', pos: 'noun', cefr: 'A1' },
  'years': { meaningVi: 'những năm, tuổi', ipa: '/jɪəz/', pos: 'noun', cefr: 'A1' },
  'today': { meaningVi: 'hôm nay', ipa: '/təˈdeɪ/', pos: 'adverb', cefr: 'A1' },
  'world': { meaningVi: 'thế giới', ipa: '/wɜːld/', pos: 'noun', cefr: 'A1' },
  'life': { meaningVi: 'cuộc sống, đời sống', ipa: '/laɪf/', pos: 'noun', cefr: 'A1' },
  'important': { meaningVi: 'quan trọng, thiết yếu', ipa: '/ɪmˈpɔː.tənt/', pos: 'adjective', cefr: 'A2' },
  'routine': { meaningVi: 'thói quen, lịch trình đều đặn', ipa: '/ruːˈtiːn/', pos: 'noun', cefr: 'B1' },
  'habit': { meaningVi: 'thói quen', ipa: '/ˈhæb.ɪt/', pos: 'noun', cefr: 'A2' },
  'habits': { meaningVi: 'các thói quen', ipa: '/ˈhæb.ɪts/', pos: 'noun', cefr: 'A2' },
  'health': { meaningVi: 'sức khỏe', ipa: '/helθ/', pos: 'noun', cefr: 'A2' },
  'healthy': { meaningVi: 'lành mạnh, khỏe mạnh', ipa: '/ˈhel.θi/', pos: 'adjective', cefr: 'A2' },
  'exercise': { meaningVi: 'tập thể dục, bài rèn luyện', ipa: '/ˈek.sə.saɪz/', pos: 'noun', cefr: 'A2' },
  'benefit': { meaningVi: 'lợi ích, điểm tốt', ipa: '/ˈben.ɪ.fɪt/', pos: 'noun', cefr: 'B1' },
  'benefits': { meaningVi: 'các lợi ích', ipa: '/ˈben.ɪ.fɪts/', pos: 'noun', cefr: 'B1' },

  // Urban & Transport & Technology (Reading 15, 24, etc.)
  'transportation': { meaningVi: 'giao thông vận tải, phương tiện đi lại', ipa: '/ˌtræn.spɔːˈteɪ.ʃən/', pos: 'noun', cefr: 'B1' },
  'public': { meaningVi: 'công cộng', ipa: '/ˈpʌb.lɪk/', pos: 'adjective', cefr: 'A2' },
  'transit': { meaningVi: 'sự quá cảnh, vận chuyển', ipa: '/ˈtræn.zɪt/', pos: 'noun', cefr: 'B2' },
  'urban': { meaningVi: 'đô thị, thành thị', ipa: '/ˈɜː.bən/', pos: 'adjective', cefr: 'B2' },
  'city': { meaningVi: 'thành phố', ipa: '/ˈsɪt.i/', pos: 'noun', cefr: 'A1' },
  'cities': { meaningVi: 'các thành phố', ipa: '/ˈsɪt.iz/', pos: 'noun', cefr: 'A1' },
  'vehicle': { meaningVi: 'phương tiện, xe cộ', ipa: '/ˈvɪə.kəl/', pos: 'noun', cefr: 'B1' },
  'vehicles': { meaningVi: 'các phương tiện giao thông', ipa: '/ˈvɪə.kəlz/', pos: 'noun', cefr: 'B1' },
  'electric': { meaningVi: 'chạy bằng điện', ipa: '/iˈlek.trɪk/', pos: 'adjective', cefr: 'A2' },
  'bus': { meaningVi: 'xe buýt', ipa: '/bʌs/', pos: 'noun', cefr: 'A1' },
  'buses': { meaningVi: 'các xe buýt', ipa: '/bʌs.ɪz/', pos: 'noun', cefr: 'A1' },
  'subway': { meaningVi: 'tàu điện ngầm', ipa: '/ˈsʌb.weɪ/', pos: 'noun', cefr: 'A2' },
  'pollution': { meaningVi: 'sự ô nhiễm', ipa: '/pəˈluː.ʃən/', pos: 'noun', cefr: 'B1' },
  'emission': { meaningVi: 'khí thải, sự phát thải', ipa: '/iˈmɪʃ.ən/', pos: 'noun', cefr: 'B2' },
  'emissions': { meaningVi: 'lượng khí thải', ipa: '/iˈmɪʃ.ənz/', pos: 'noun', cefr: 'B2' },
  'technology': { meaningVi: 'công nghệ', ipa: '/tekˈnɒl.ə.dʒi/', pos: 'noun', cefr: 'B1' },
  'artificial': { meaningVi: 'nhân tạo', ipa: '/ˌɑː.tɪˈfɪʃ.əl/', pos: 'adjective', cefr: 'B2' },
  'intelligence': { meaningVi: 'trí thông minh', ipa: '/ɪnˈtel.ɪ.dʒəns/', pos: 'noun', cefr: 'B2' },
  'online': { meaningVi: 'trực tuyến, trên mạng', ipa: '/ˈɒn.laɪn/', pos: 'adjective', cefr: 'A1' },
  'shopping': { meaningVi: 'việc mua sắm', ipa: '/ˈʃɒp.ɪŋ/', pos: 'noun', cefr: 'A1' },
  'social': { meaningVi: 'xã hội', ipa: '/ˈsəʊ.ʃəl/', pos: 'adjective', cefr: 'A2' },
  'media': { meaningVi: 'truyền thông, phương tiện đại chúng', ipa: '/ˈmiː.di.ə/', pos: 'noun', cefr: 'B1' },
};

/**
 * Intelligent stemmer and dictionary lookup:
 * Handles exact words, plurals (-s, -es, -ies), verb forms (-ed, -d, -ing), adverbs (-ly),
 * punctuation-wrapped tokens, and provides high-accuracy Vietnamese definitions.
 */
export function lookupLocalDictionary(word: string): DictionaryEntry | null {
  if (!word) return null;

  // Clean word: remove all punctuation around or inside
  const clean = word.toLowerCase().trim().replace(/[.,?!:;"'()—–\-_\[\]{}]/g, '');
  if (!clean) return null;

  // 1. Direct match
  if (COMMON_DICTIONARY[clean]) {
    return COMMON_DICTIONARY[clean];
  }

  // 2. Plural -ies -> -y (e.g. priorities -> priority)
  if (clean.endsWith('ies') && clean.length > 4) {
    const rootY = clean.slice(0, -3) + 'y';
    if (COMMON_DICTIONARY[rootY]) {
      const base = COMMON_DICTIONARY[rootY];
      return { ...base, meaningVi: `(các) ${base.meaningVi}` };
    }
  }

  // 3. Plural -es (e.g. workplaces -> workplace, services -> service, buses -> bus)
  if (clean.endsWith('es') && clean.length > 3) {
    const root1 = clean.slice(0, -1); // remove 's' (e.g. workplaces -> workplace)
    if (COMMON_DICTIONARY[root1]) {
      const base = COMMON_DICTIONARY[root1];
      return { ...base, meaningVi: `(những/các) ${base.meaningVi}` };
    }
    const root2 = clean.slice(0, -2); // remove 'es' (e.g. buses -> bus)
    if (COMMON_DICTIONARY[root2]) {
      const base = COMMON_DICTIONARY[root2];
      return { ...base, meaningVi: `(những/các) ${base.meaningVi}` };
    }
  }

  // 4. Regular plural -s (e.g. backgrounds -> background, goals -> goal)
  if (clean.endsWith('s') && clean.length > 2) {
    const root = clean.slice(0, -1);
    if (COMMON_DICTIONARY[root]) {
      const base = COMMON_DICTIONARY[root];
      return { ...base, meaningVi: `(những/các) ${base.meaningVi}` };
    }
  }

  // 5. Past tense -ied -> -y
  if (clean.endsWith('ied') && clean.length > 4) {
    const rootY = clean.slice(0, -3) + 'y';
    if (COMMON_DICTIONARY[rootY]) {
      const base = COMMON_DICTIONARY[rootY];
      return { ...base, meaningVi: `đã ${base.meaningVi}` };
    }
  }

  // 6. Past tense -ed / -d (e.g. managed -> manage, escalated -> escalate, handled -> handle)
  if (clean.endsWith('ed') && clean.length > 3) {
    const rootD = clean.slice(0, -1); // e.g. managed -> manage
    if (COMMON_DICTIONARY[rootD]) {
      const base = COMMON_DICTIONARY[rootD];
      return { ...base, meaningVi: `đã ${base.meaningVi}, được ${base.meaningVi}` };
    }
    const rootED = clean.slice(0, -2); // e.g. started -> start
    if (COMMON_DICTIONARY[rootED]) {
      const base = COMMON_DICTIONARY[rootED];
      return { ...base, meaningVi: `đã ${base.meaningVi}, được ${base.meaningVi}` };
    }
  }

  // 7. Continuous -ing (e.g. communicating -> communicate, licking -> lick)
  if (clean.endsWith('ing') && clean.length > 4) {
    const rootE = clean.slice(0, -3) + 'e'; // communicating -> communicate
    if (COMMON_DICTIONARY[rootE]) {
      const base = COMMON_DICTIONARY[rootE];
      return { ...base, meaningVi: `đang ${base.meaningVi}, việc ${base.meaningVi}` };
    }
    const root = clean.slice(0, -3); // licking -> lick
    if (COMMON_DICTIONARY[root]) {
      const base = COMMON_DICTIONARY[root];
      return { ...base, meaningVi: `đang ${base.meaningVi}, việc ${base.meaningVi}` };
    }
  }

  // 8. Adverb -ly (e.g. poorly -> poor)
  if (clean.endsWith('ly') && clean.length > 4) {
    const root = clean.slice(0, -2);
    if (COMMON_DICTIONARY[root]) {
      const base = COMMON_DICTIONARY[root];
      return { ...base, pos: 'adverb', meaningVi: `một cách ${base.meaningVi}` };
    }
  }

  return null;
}
