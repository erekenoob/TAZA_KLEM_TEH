/**
 * Класс TazaKilemManagerCalc на базе jQuery
 * Калькулятор для расчета стоимости стирки ковров (450 тг/м²)
 * и прямой отправки квитанции на номер клиента в WhatsApp на KZ / RU.
 */
class TazaKilemManagerCalc {
  constructor(config = {}) {
    this.pricePerSqm = config.pricePerSqm || 450;
    this.storageKey = 'taza_kilem_manager_lang';
    this.currentLang = localStorage.getItem(this.storageKey) || 'ru';

    // Словарь переводов RU / KZ
    this.translations = {
      ru: {
        header_sub: 'Калькулятор заказа и отправка клиенту',
        sec_client_title: '1. Данные клиента (кому отправить расчет)',
        lbl_phone: 'Номер WhatsApp клиента *',
        ph_phone: '+7 (777) 123-45-67',
        lbl_address: 'Адрес клиента',
        ph_address: 'п. Шиели, ул. Абая, 15',

        sec_carpets_title: '2. Размеры ковров (450 ₸ / м²)',
        sec_carpets_hint: 'Новая строка добавляется автоматически',
        carpet_prefix: 'Ковер №',
        lbl_length: 'Длина (м)',
        lbl_width: 'Ширина (м)',
        tot_count: 'Ковров:',
        tot_area: 'Общая площадь:',
        tot_sum: 'Итого к оплате:',

        sec_delivery_title: '3. График развозки (забор и доставка)',
        lbl_pickup: 'Когда заберут с адреса (забор):',
        ph_pickup: 'Сегодня, 15:00 – 17:00',
        lbl_delivery: 'Когда доставят обратно (доставка):',
        ph_delivery: 'Через 2 дня, после 16:00',

        sec_comment_title: '4. Комментарий к заказу',
        ph_comment: 'Дополнительная информация: способ оплаты, ориентир, выведение сложных пятен...',

        btn_reset: 'Очистить форму',
        btn_send: 'Отправить сообщение клиенту в WhatsApp',

        alert_no_phone: 'Пожалуйста, введите корректный номер WhatsApp клиента (например: +7 777 123 45 67).',
        alert_no_carpets: 'Пожалуйста, укажите длину и ширину хотя бы одного ковра.'
      },
      kz: {
        header_sub: 'Тапсырыс калькуляторы және клиентке жіберу',
        sec_client_title: '1. Клиент деректері (есепті кімге жіберу керек)',
        lbl_phone: 'Клиенттің WhatsApp нөмірі *',
        ph_phone: '+7 (777) 123-45-67',
        lbl_address: 'Клиент мекенжайы',
        ph_address: 'Шиелі кенті, Абай көшесі, 15',

        sec_carpets_title: '2. Кілем өлшемдері (450 ₸ / м²)',
        sec_carpets_hint: 'Жаңа жол автоматты түрде қосылады',
        carpet_prefix: 'Кілем №',
        lbl_length: 'Ұзындығы (м)',
        lbl_width: 'Ені (м)',
        tot_count: 'Кілем саны:',
        tot_area: 'Жалпы ауданы:',
        tot_sum: 'Төленетін сома:',

        sec_delivery_title: '3. Тасымалдау уақыты (алып кету және жеткізу)',
        lbl_pickup: 'Мекенжайдан қашан алып кетеді (забор):',
        ph_pickup: 'Бүгін, 15:00 – 17:00',
        lbl_delivery: 'Қашан қайта жеткізіледі (доставка):',
        ph_delivery: '2 күннен кейін, 16:00-ден соң',

        sec_comment_title: '4. Тапсырысқа түсініктеме (комментарий)',
        ph_comment: 'Қосымша ақпарат: төлем түрі, бағдар, қиын дақтарды кетіру...',

        btn_reset: 'Форманы тазалау',
        btn_send: 'Клиентке WhatsApp-қа хабарлама жіберу',

        alert_no_phone: 'Клиенттің WhatsApp нөмірін дұрыс енгізіңіз (мысалы: +7 777 123 45 67).',
        alert_no_carpets: 'Кем дегенде бір кілемнің ұзындығы мен енін енгізіңіз.'
      }
    };

    this.init();
  }

  init() {
    this.bindLanguageSwitch();
    this.bindCalculatorEvents();
    this.addCarpetRow();
    this.applyLanguage(this.currentLang);
  }

  // Переключение языков KZ / RU
  bindLanguageSwitch() {
    const self = this;
    $('.lang-btn').on('click', function () {
      const lang = $(this).data('lang');
      self.applyLanguage(lang);
    });
  }

  applyLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem(this.storageKey, lang);
    $('html').attr('lang', lang);

    $('.lang-btn').removeClass('active');
    $(`.lang-btn[data-lang="${lang}"]`).addClass('active');

    const dict = this.translations[lang];

    $('[data-i18n]').each(function () {
      const key = $(this).data('i18n');
      if (dict[key]) {
        $(this).text(dict[key]);
      }
    });

    $('[data-i18n-placeholder]').each(function () {
      const key = $(this).data('i18n-placeholder');
      if (dict[key]) {
        $(this).attr('placeholder', dict[key]);
      }
    });

    this.updateRowLabels();
  }

  // События калькулятора и кнопок
  bindCalculatorEvents() {
    const self = this;

    // Пересчет при вводе длины или ширины
    $('#carpetList').on('input', '.carpet-length, .carpet-width', function () {
      self.recalculate();
    });

    // Удаление ковра
    $('#carpetList').on('click', '.remove-carpet-btn', function () {
      if ($('.carpet-row').length > 1) {
        $(this).closest('.carpet-row').remove();
        self.updateRowLabels();
        self.recalculate();
      }
    });

    // Полная очистка формы
    $('#resetBtn').on('click', function () {
      $('#customerPhone').val('');
      $('#customerAddress').val('');
      $('#pickupTime').val('');
      $('#deliveryTime').val('');
      $('#orderComment').val('');
      $('#carpetList').empty();
      self.addCarpetRow();
      self.recalculate();
    });

    // Отправка сообщения на WhatsApp клиента
    $('#sendToClientBtn').on('click', function () {
      self.sendToCustomerWhatsApp();
    });
  }

  addCarpetRow() {
    const index = $('.carpet-row').length + 1;
    const dict = this.translations[this.currentLang];

    const $row = $(`
      <div class="carpet-row">
        <div class="carpet-row__title">
          <span class="row-prefix">${dict.carpet_prefix}</span><span class="row-num">${index}</span>
        </div>

        <div class="field-group">
          <label class="lbl-len">${dict.lbl_length}</label>
          <input type="text" inputmode="decimal" class="carpet-length" placeholder="3.0">
        </div>

        <div class="field-group">
          <label class="lbl-wid">${dict.lbl_width}</label>
          <input type="text" inputmode="decimal" class="carpet-width" placeholder="2.0">
        </div>

        <div class="carpet-row__result">
          <span class="carpet-row__area"><span class="row-area">0.00</span> м²</span>
          <span class="carpet-row__sum"><span class="row-sum">0</span> ₸</span>
        </div>

        <button type="button" class="remove-carpet-btn" title="Удалить">&times;</button>
      </div>
    `);

    $('#carpetList').append($row);
    this.updateRowLabels();
  }

  updateRowLabels() {
    const dict = this.translations[this.currentLang];
    const $rows = $('.carpet-row');

    $rows.each(function (idx) {
      $(this).find('.row-prefix').text(dict.carpet_prefix);
      $(this).find('.row-num').text(idx + 1);
      $(this).find('.lbl-len').text(dict.lbl_length);
      $(this).find('.lbl-wid').text(dict.lbl_width);
      $(this).find('.remove-carpet-btn').prop('disabled', $rows.length === 1);
    });
  }

  parseNumber(val) {
    if (!val) return 0;
    const cleaned = String(val).replace(',', '.').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  recalculate() {
    const self = this;
    let totalCount = 0;
    let totalArea = 0;
    let totalPrice = 0;

    $('.carpet-row').each(function () {
      const len = self.parseNumber($(this).find('.carpet-length').val());
      const wid = self.parseNumber($(this).find('.carpet-width').val());
      const area = len * wid;
      const sum = Math.round(area * self.pricePerSqm);

      $(this).find('.row-area').text(area.toFixed(2));
      $(this).find('.row-sum').text(sum.toLocaleString('ru-RU'));

      if (area > 0) {
        totalCount++;
        totalArea += area;
        totalPrice += sum;
      }
    });

    // Автоматически добавляем следующий счетчик ковра, если последний заполнен
    const $last = $('.carpet-row').last();
    const lastLen = this.parseNumber($last.find('.carpet-length').val());
    const lastWid = this.parseNumber($last.find('.carpet-width').val());

    if (lastLen > 0 && lastWid > 0) {
      this.addCarpetRow();
    }

    $('#totalCarpets').text(totalCount);
    $('#totalArea').text(totalArea.toFixed(2));
    $('#totalPrice').text(totalPrice.toLocaleString('ru-RU'));
  }

  // Нормализация казахстанского/международного номера для wa.me
  formatPhoneForWhatsApp(rawPhone) {
    let digits = String(rawPhone).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    } else if (digits.length === 10 && digits.startsWith('7')) {
      digits = '7' + digits;
    }
    return digits;
  }

  // Формирование и отправка сообщения клиенту в WhatsApp
  sendToCustomerWhatsApp() {
    const self = this;
    const dict = this.translations[this.currentLang];

    const rawPhone = $('#customerPhone').val().trim();
    const waPhone = this.formatPhoneForWhatsApp(rawPhone);

    if (waPhone.length < 11) {
      alert(dict.alert_no_phone);
      $('#customerPhone').focus();
      return;
    }

    const carpetLines = [];
    let count = 0;
    let totalArea = 0;
    let totalPrice = 0;

    $('.carpet-row').each(function () {
      const len = self.parseNumber($(this).find('.carpet-length').val());
      const wid = self.parseNumber($(this).find('.carpet-width').val());

      if (len > 0 && wid > 0) {
        count++;
        const area = len * wid;
        const sum = Math.round(area * self.pricePerSqm);
        totalArea += area;
        totalPrice += sum;

        carpetLines.push(
          `${count}) ${len}м × ${wid}м = ${area.toFixed(2)} м² — ${sum.toLocaleString('ru-RU')} ₸`
        );
      }
    });

    if (count === 0) {
      alert(dict.alert_no_carpets);
      return;
    }

    const address = $('#customerAddress').val().trim();
    const pickupTime = $('#pickupTime').val().trim();
    const deliveryTime = $('#deliveryTime').val().trim();
    const comment = $('#orderComment').val().trim();

    const isKz = this.currentLang === 'kz';
    const messageParts = [];

    // Приветствие от компании
    messageParts.push(
      isKz
        ? 'Сәлеметсіз бе! *TAZA KILEM SHIELI* кілем жуу орталығынан тапсырыс есебі:'
        : 'Здравствуйте! Расчет вашего заказа от *TAZA KILEM SHIELI*:'
    );

    // Список ковров
    messageParts.push('');
    messageParts.push(carpetLines.join('\n'));

    // Итоги
    messageParts.push('');
    messageParts.push(
      isKz
        ? `Жалпы ауданы: *${totalArea.toFixed(2)} м²*\nЖалпы сомасы: *${totalPrice.toLocaleString('ru-RU')} ₸* (450 ₸/м²)`
        : `Общая площадь: *${totalArea.toFixed(2)} м²*\nИтого к оплате: *${totalPrice.toLocaleString('ru-RU')} ₸* (450 ₸/м²)`
    );

    // Адрес и график развозки (добавляются, если заполнены)
    const logisticsLines = [];
    if (address) {
      logisticsLines.push(isKz ? `📍 Мекенжай: ${address}` : `📍 Адрес: ${address}`);
    }
    if (pickupTime) {
      logisticsLines.push(isKz ? `🚚 Алып кету уақыты: ${pickupTime}` : `🚚 Время забора: ${pickupTime}`);
    }
    if (deliveryTime) {
      logisticsLines.push(isKz ? `📦 Жеткізу уақыты: ${deliveryTime}` : `📦 Время доставки: ${deliveryTime}`);
    }
    if (logisticsLines.length > 0) {
      messageParts.push('');
      messageParts.push(logisticsLines.join('\n'));
    }

    // Комментарий (добавляется, если заполнен)
    if (comment) {
      messageParts.push('');
      messageParts.push(isKz ? `💬 Түсініктеме: ${comment}` : `💬 Комментарий: ${comment}`);
    }

    // Подпись
    messageParts.push('');
    messageParts.push(
      isKz
        ? 'Тазалық — біздің атымыз бен абыройымыз! Рақмет!'
        : 'Чистота — наше имя и репутация! Спасибо за обращение!'
    );

    const finalMessage = messageParts.join('\n');
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(finalMessage)}`;
    window.open(waUrl, '_blank');
  }
}

// Инициализация класса после загрузки DOM
$(function () {
  window.tazaKilemManager = new TazaKilemManagerCalc({
    pricePerSqm: 450
  });
});