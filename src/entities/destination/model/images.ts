// scripts로 내려받은 위키미디어 공용 이미지와 저작자 표시입니다.
import type { Destination } from './types';

export const DESTINATION_IMAGES: Record<string, Pick<Destination, 'image' | 'imageCredit'>> = {
  'abu-simbel': {
    image: require('~/assets/destinations/abu-simbel.jpg'),
    imageCredit: {
      author: 'youssef_alam',
      license: 'CC BY 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Ramsis,_Aswan_Governorate,_Egypt_-_panoramio.jpg',
    },
  },
  acropolis: {
    image: require('~/assets/destinations/acropolis.jpg'),
    imageCredit: {
      author: 'Giles Laurent',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:1029_Acropolis_of_Athens_in_Greece_at_night_Photo_by_Giles_Laurent.jpg',
    },
  },
  'angkor-wat': {
    image: require('~/assets/destinations/angkor-wat.jpg'),
    imageCredit: {
      author: 'Bjørn Christian Tørrissen',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Angkor_Wat.jpg',
    },
  },
  arcadia: {
    image: require('~/assets/destinations/arcadia.jpg'),
    imageCredit: {
      author: 'Thomas Cole',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg',
    },
  },
  asgard: {
    image: require('~/assets/destinations/asgard.jpg'),
    imageCredit: {
      author: 'Emil Doepler',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Walhall_by_Emil_Doepler.jpg',
    },
  },
  atlantis: {
    image: require('~/assets/destinations/atlantis.jpg'),
    imageCredit: {
      author: 'Athanasius Kircher',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Atlantis_Kircher_Mundus_subterraneus_1678.jpg',
    },
  },
  avalon: {
    image: require('~/assets/destinations/avalon.jpg'),
    imageCredit: {
      author: 'Edward Burne-Jones',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Burne-Jones_Last_Sleep_of_Arthur_in_Avalon_v2.jpg',
    },
  },
  bagan: {
    image: require('~/assets/destinations/bagan.jpg'),
    imageCredit: {
      author: 'Corto Maltese 1999',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Bagan,_Burma.jpg',
    },
  },
  borobudur: {
    image: require('~/assets/destinations/borobudur.jpg'),
    imageCredit: {
      author: 'Heri nugroho',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Pradaksina.jpg',
    },
  },
  camelot: {
    image: require('~/assets/destinations/camelot.jpg'),
    imageCredit: {
      author: 'Gustave Doré',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Idylls_of_the_King_3.jpg',
    },
  },
  carthage: {
    image: require('~/assets/destinations/carthage.jpg'),
    imageCredit: {
      author: 'Tamerlan Dulaev',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Baths_of_Antoninus,_Carthage.jpg',
    },
  },
  'chichen-itza': {
    image: require('~/assets/destinations/chichen-itza.jpg'),
    imageCredit: {
      author: 'Daniel Schwen',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Chichen_Itza_3.jpg',
    },
  },
  cibola: {
    image: require('~/assets/destinations/cibola.jpg'),
    imageCredit: {
      author: 'Frederic Remington',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Frederic_Remington_-_Coronado_sets_out_to_the_north.jpg',
    },
  },
  colosseum: {
    image: require('~/assets/destinations/colosseum.jpg'),
    imageCredit: {
      author: 'FeaturedPics',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Colosseo_2020.jpg',
    },
  },
  'el-dorado': {
    image: require('~/assets/destinations/el-dorado.jpg'),
    imageCredit: {
      author: 'Camilo.Errante',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Laguna_de_Guatavita_centro_de_la_leyenda_del_Dorado.jpg',
    },
  },
  elysion: {
    image: require('~/assets/destinations/elysion.jpg'),
    imageCredit: {
      author: 'Christina Gkioka',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:%CE%91%CF%81%CF%87%CE%B1%CE%B9%CE%BF%CE%BB%CE%BF%CE%B3%CE%B9%CE%BA%CF%8C%CF%82_%CF%87%CF%8E%CF%81%CE%BF%CF%82_%CE%95%CE%BB%CE%B5%CF%85%CF%83%CE%AF%CE%BD%CE%B1%CF%82.jpg',
    },
  },
  ephesus: {
    image: require('~/assets/destinations/ephesus.jpg'),
    imageCredit: {
      author: 'Benh LIEU SONG',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Ephesus_Celsus_Library_Fa%C3%A7ade.jpg',
    },
  },
  giza: {
    image: require('~/assets/destinations/giza.jpg'),
    imageCredit: {
      author: 'KennyOMG',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Pyramids_of_the_Giza_Necropolis.jpg',
    },
  },
  'gobekli-tepe': {
    image: require('~/assets/destinations/gobekli-tepe.jpg'),
    imageCredit: {
      author: 'Teomancimit',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:G%C3%B6bekli_Tepe,_Urfa.jpg',
    },
  },
  'great-zimbabwe': {
    image: require('~/assets/destinations/great-zimbabwe.jpg'),
    imageCredit: {
      author: 'Andrew Moore',
      license: 'CC BY-SA 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Conical_Tower_-_Great_Enclosure_III_(33736918448).jpg',
    },
  },
  gyeongju: {
    image: require('~/assets/destinations/gyeongju.jpg'),
    imageCredit: {
      author: '작자 미상',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju,_Korea.jpg',
    },
  },
  hampi: {
    image: require('~/assets/destinations/hampi.jpg'),
    imageCredit: {
      author: 'iMahesh',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Wide_angle_of_Galigopuram_of_Virupaksha_Temple,_Hampi_(04)_(cropped).jpg',
    },
  },
  ieodo: {
    image: require('~/assets/destinations/ieodo.jpg'),
    imageCredit: {
      author: '해양과학기지_Korea Ocean Research Station',
      license: 'CC BY 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Ieodo_Ocean_Research_Station_in_2021.jpg',
    },
  },
  karnak: {
    image: require('~/assets/destinations/karnak.jpg'),
    imageCredit: {
      author: 'René Hourdry',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Temple_de_Louxor_68.jpg',
    },
  },
  knossos: {
    image: require('~/assets/destinations/knossos.jpg'),
    imageCredit: {
      author: 'Moonik',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Knossos_north_entrance,_Crete_001.JPG',
    },
  },
  kunlun: {
    image: require('~/assets/destinations/kunlun.jpg'),
    imageCredit: {
      author: '작자 미상',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Lamp_Representing_the_Realm_of_the_Queen_Mother_of_the_West_(1st%E2%80%932nd_century_CE).jpg',
    },
  },
  'machu-picchu': {
    image: require('~/assets/destinations/machu-picchu.jpg'),
    imageCredit: {
      author: 'Draceane',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Machu_Picchu,_2023_(012).jpg',
    },
  },
  nazca: {
    image: require('~/assets/destinations/nazca.jpg'),
    imageCredit: {
      author: 'Diego Delso',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:L%C3%ADneas_de_Nazca,_Nazca,_Per%C3%BA,_2015-07-29,_DD_49.JPG',
    },
  },
  olympus: {
    image: require('~/assets/destinations/olympus.jpg'),
    imageCredit: {
      author: 'kallerna',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Olympus_National_Park_30.jpg',
    },
  },
  'peach-blossom': {
    image: require('~/assets/destinations/peach-blossom.jpg'),
    imageCredit: {
      author: 'Zhang Hong',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:%E6%98%8E-%E6%B8%85_%E5%BC%B5%E5%AE%8F_%E6%A1%83%E6%BA%90%E5%8B%9D%E6%A6%82%E5%9C%96_%E5%8D%B7-Peach_Blossom_Spring_MET_S_L_4_2007_1_1_sec01.jpg',
    },
  },
  penglai: {
    image: require('~/assets/destinations/penglai.jpg'),
    imageCredit: {
      author: 'Fanghong',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Penglaige.jpg',
    },
  },
  petra: {
    image: require('~/assets/destinations/petra.jpg'),
    imageCredit: {
      author: 'Azurfrog',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Al_Deir_Petra.JPG',
    },
  },
  pompeii: {
    image: require('~/assets/destinations/pompeii.jpg'),
    imageCredit: {
      author: 'Carsten Steger',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Aerial_image_of_Pompeii_and_Mount_Vesuvius_(view_from_the_southeast).jpg',
    },
  },
  'rapa-nui': {
    image: require('~/assets/destinations/rapa-nui.jpg'),
    imageCredit: {
      author: 'Ian Sewell',
      license: 'CC BY 2.5',
      url: 'https://commons.wikimedia.org/wiki/File:AhuTongariki.JPG',
    },
  },
  shambhala: {
    image: require('~/assets/destinations/shambhala.jpg'),
    imageCredit: {
      author: '작자 미상',
      license: 'CC BY 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:An_early_Tibetan_king,_or_Rudrakulika,_legendary_king_of_Sha_Wellcome_L0015310.jpg',
    },
  },
  'shangri-la': {
    image: require('~/assets/destinations/shangri-la.jpg'),
    imageCredit: {
      author: 'Colin W',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Songzanlin_Monastery,_Shangri-La,_China_-_panoramio.jpg',
    },
  },
  stonehenge: {
    image: require('~/assets/destinations/stonehenge.jpg'),
    imageCredit: {
      author: 'garethwiscombe',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Stonehenge2007_07_30.jpg',
    },
  },
  sumeru: {
    image: require('~/assets/destinations/sumeru.jpg'),
    imageCredit: {
      author: 'Ondřej Žváček',
      license: 'CC BY 2.5',
      url: 'https://commons.wikimedia.org/wiki/File:Kailash_north.JPG',
    },
  },
  takamagahara: {
    image: require('~/assets/destinations/takamagahara.jpg'),
    imageCredit: {
      author: 'Utagawa Kunisada (歌川国貞)',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Amaterasu_cave_wide.jpg',
    },
  },
  teotihuacan: {
    image: require('~/assets/destinations/teotihuacan.jpg'),
    imageCredit: {
      author: 'Hdlrosa',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:ZA77_Teotihuac%C3%A1n_edo_de_mex_Herberto_de_la_rosa.jpg',
    },
  },
  terracotta: {
    image: require('~/assets/destinations/terracotta.jpg'),
    imageCredit: {
      author: 'xiquinhosilva',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:51714-Terracota-Army.jpg',
    },
  },
  thule: {
    image: require('~/assets/destinations/thule.jpg'),
    imageCredit: {
      author: 'Olaus Magnus',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Thule_carta_marina_Olaus_Magnus.jpg',
    },
  },
  tikal: {
    image: require('~/assets/destinations/tikal.jpg'),
    imageCredit: {
      author: 'Mundo Maya',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Tikal_3.jpg',
    },
  },
  'tir-na-nog': {
    image: require('~/assets/destinations/tir-na-nog.jpg'),
    imageCredit: {
      author: 'Arthur Rackham',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Irishfairytales01step_0137.jpg',
    },
  },
  utopia: {
    image: require('~/assets/destinations/utopia.jpg'),
    imageCredit: {
      author: 'Original uploader was Marcok at it.wikipedia',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Isola_di_Utopia_Moro.jpg',
    },
  },
  eden: {
    image: require('~/assets/destinations/eden.jpg'),
    imageCredit: {
      author: 'Thomas Cole',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Thomas_Cole_-_The_Garden_of_Eden_(1828).jpg',
    },
  },
  dilmun: {
    image: require('~/assets/destinations/dilmun.jpg'),
    imageCredit: {
      author: 'Beireke1',
      license: 'CC0',
      url: "https://commons.wikimedia.org/wiki/File:Qal'at_al-Bahrain_2.jpg",
    },
  },
  aaru: {
    image: require('~/assets/destinations/aaru.jpg'),
    imageCredit: {
      author: 'Charles K. Wilkinson (Metropolitan Museum of Art)',
      license: 'CC0',
      url: 'https://commons.wikimedia.org/wiki/File:Sennedjem_and_Iineferti_in_the_Fields_of_Iaru_MET_DT11771.jpg',
    },
  },
  hades: {
    image: require('~/assets/destinations/hades.jpg'),
    imageCredit: {
      author: 'Joachim Patinir',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Joachim_Patinir_007.jpg',
    },
  },
  valhalla: {
    image: require('~/assets/destinations/valhalla.jpg'),
    imageCredit: {
      author: 'Avda',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Walhalla_-_Donaustauf_-_2015.jpg',
    },
  },
  yomi: {
    image: require('~/assets/destinations/yomi.jpg'),
    imageCredit: {
      author: 'ChiefHira',
      license: 'CC BY-SA 3.0',
      url: 'https://commons.wikimedia.org/wiki/File:Yomotsu_Hirasaka.JPG',
    },
  },
  xibalba: {
    image: require('~/assets/destinations/xibalba.jpg'),
    imageCredit: {
      author: 'Antti T. Nissinen',
      license: 'CC BY 2.0',
      url: 'https://commons.wikimedia.org/wiki/File:Actun_Tunichil_Muknal_2010_1.jpg',
    },
  },
  aztlan: {
    image: require('~/assets/destinations/aztlan.jpg'),
    imageCredit: {
      author: 'Luis Méndez Covarrubias',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Isla_Mexcaltitan.jpg',
    },
  },
  ys: {
    image: require('~/assets/destinations/ys.jpg'),
    imageCredit: {
      author: 'Évariste-Vital Luminais',
      license: 'Public domain',
      url: 'https://commons.wikimedia.org/wiki/File:Evariste-Vital_Luminais_-_Fuite_de_Gradlon_(ca._1884).jpg',
    },
  },
  'nirai-kanai': {
    image: require('~/assets/destinations/nirai-kanai.jpg'),
    imageCredit: {
      author: 'そらみみ',
      license: 'CC BY-SA 4.0',
      url: 'https://commons.wikimedia.org/wiki/File:Kudakajima_Island_from_Cape_Chinen_Park.JPG',
    },
  },
};
