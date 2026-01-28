import axios from 'axios'
import { writeFile } from 'fs'
import { readFile } from 'fs/promises'
import { createInterface } from 'readline'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const writeToFile = (data, filePath = 'output.json') => {
  const dataJson = JSON.stringify(data, null, 2)
  writeFile(filePath, dataJson, err => {
    if (err) {
      console.error('Error writing file:', err)
      return
    }
    console.log('File written', filePath)
  })
}

let skin_info = []
let item_name = []

let keychains_info = []
let sticker_info = []
let crate_info = []
let graffiti_info = []

let item_name_keychains = []
let item_name_stickers = []
let item_name_crates = []
let item_name_graffiti = []

// base path to your local API data
const API_DIR = join(__dirname, 'public', 'api')

// ---------- Helpers ----------

const loadJson = async ({ useLocalFile = true, localFilePath, remoteUrl }) => {
  if (useLocalFile) {
    if (!localFilePath) {
      throw new Error('localFilePath is required when useLocalFile = true')
    }
    const raw = await readFile(localFilePath, 'utf8')
    return JSON.parse(raw)
  }

  const response = await axios.get(remoteUrl)
  return response.data
}

const getNumericId = obj => {
  if (!obj?.id) return NaN
  const parts = String(obj.id).split('-')
  const last = parts[parts.length - 1]
  const n = parseInt(last, 10)
  return Number.isNaN(n) ? NaN : n
}

const filterByIdRange = (data, { id, idMin, idMax }) => {
  if (id == null && idMin == null && idMax == null) return data
  return data.filter(obj => {
    const n = getNumericId(obj)
    if (Number.isNaN(n)) return false
    if (id != null && n !== id) return false
    if (idMin != null && n < idMin) return false
    if (idMax != null && n > idMax) return false
    return true
  })
}

// ---------- Skins (skin-info + item-name) ----------

const getItemsData = async (options = {}) => {
  const {
    useLocalFile = true,
    localFilePath,
    crateIds,
    collectionIds,
    id,
    idMin,
    idMax,
  } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'en', 'skins.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
  })

  let newItems = data

  if (crateIds && crateIds.length) {
    newItems = data.filter(d => d?.crates && crateIds.includes(d?.crates[0]?.id))
  } else if (collectionIds && collectionIds.length) {
    newItems = data.filter(
      d => d?.collections && collectionIds.includes(d?.collections[0]?.id),
    )
  } else if (id != null || idMin != null || idMax != null) {
    newItems = filterByIdRange(data, { id, idMin, idMax })
  } else {
    const defaultCollectionsIds = [
      'collection-set-realism-camo',
      'collection-set-graphic-design',
      'collection-set-community-34',
      'collection-set-overpass-2024',
    ]
    newItems = data.filter(
      d => d.collections && defaultCollectionsIds.includes(d?.collections[0]?.id),
    )
  }

  const mappedItems = newItems.map(item => {
    const returnedItem = {
      ...item,
      _crates: item?.crates?.map(x => x?.id),
      weapon: item?.weapon?.name,
      pattern: item?.pattern?.name,
      rarity: item?.rarity?.name,
      collection: item.collections?.[0]?.name,
      category: item?.category?.name
        ? item.category.name
        : item?.name?.includes('Kukri')
          ? 'Knives'
          : null,
      maxFloat: item?.max_float,
      minFloat: item?.min_float,
      paintIndex: item?.paint_index,
      wears: item?.wears?.map(x => x?.name),
      name: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
    }

    delete returnedItem.crates
    delete returnedItem.paint_index
    delete returnedItem.max_float
    delete returnedItem.min_float
    delete returnedItem.team
    delete returnedItem.collections
    if (!returnedItem.collection) delete returnedItem.collection

    return returnedItem
  })

  skin_info = mappedItems
}

const getPortugueseNames = async (options = {}) => {
  const { useLocalFile = true, localFilePath } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'pt-BR', 'skins.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/pt-BR/skins.json',
  })

  const newItems = data.filter(item => skin_info.some(x => x.id === item.id))

  const mappedItems = newItems.map(item => {
    const returnedItem = {
      id: item.id,
      marketHashNamePtBR: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
      marketHashNameEn: skin_info?.find(x => x?.id === item?.id)?.name || null,
    }
    return returnedItem
  })

  item_name = mappedItems
}

// ---------- Stickers (sticker-info + item-name) ----------

const getStickersData = async (options = {}) => {
  const {
    useLocalFile = true,
    localFilePath,
    crateIds,
    collectionIds,
    id,
    idMin,
    idMax,
  } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'en', 'stickers.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json',
  })

  let newStickers = data

  if (crateIds && crateIds.length) {
    newStickers = data.filter(d => d?.crates && crateIds.includes(d?.crates[0]?.id))
  } else if (collectionIds && collectionIds.length) {
    newStickers = data.filter(
      d => d?.collections && collectionIds.includes(d?.collections[0]?.id),
    )
  } else if (id != null || idMin != null || idMax != null) {
    newStickers = filterByIdRange(data, { id, idMin, idMax })
  } else {
    newStickers = data.filter(
      d => d?.collections?.[0]?.id === 'collection-set-sugarface2',
    )
  }

  const mappedStickers = newStickers.map(sticker => {
    const returnedSticker = {
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      rarity: sticker.rarity.name,
      image: sticker.image,
    }
    return returnedSticker
  })

  sticker_info = mappedStickers
}

const getPortugueseNamesStickers = async (options = {}) => {
  const { useLocalFile = true, localFilePath } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'pt-BR', 'stickers.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/pt-BR/stickers.json',
  })

  const newStickers = data.filter(item => sticker_info.some(x => x.id === item.id))

  const mappedItems = newStickers.map(item => {
    const returnedItem = {
      id: item.id,
      marketHashNamePtBR: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
      marketHashNameEn: sticker_info?.find(x => x?.id === item?.id)?.name || null,
    }
    return returnedItem
  })

  item_name_stickers = mappedItems
}

// ---------- Graffiti (graffiti-info + item-name) ----------

const getGraffitiData = async (options = {}) => {
  const {
    useLocalFile = true,
    localFilePath,
    crateIds,
    collectionIds,
    id,
    idMin,
    idMax,
  } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'en', 'graffiti.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/graffiti.json',
  })

  let newGraffitis = data

  if (crateIds && crateIds.length) {
    newGraffitis = data.filter(d => d?.crates && crateIds.includes(d?.crates[0]?.id))
  } else if (collectionIds && collectionIds.length) {
    newGraffitis = data.filter(
      d => d?.collections && collectionIds.includes(d?.collections[0]?.id),
    )
  } else if (id != null || idMin != null || idMax != null) {
    newGraffitis = filterByIdRange(data, { id, idMin, idMax })
  } else {
    newGraffitis = data.filter(d => {
      const n = getNumericId(d)
      return !Number.isNaN(n) && n >= 7354
    })
  }

  const mappedGraffitis = newGraffitis.map(sticker => {
    const returnedSticker = {
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      rarity: sticker.rarity.name,
      image: sticker.image,
    }
    return returnedSticker
  })

  graffiti_info = mappedGraffitis
}

const getPortugueseNamesGraffiti = async (options = {}) => {
  const { useLocalFile = true, localFilePath } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'pt-BR', 'graffiti.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/pt-BR/graffiti.json',
  })

  const newGraffitis = data.filter(item => graffiti_info.some(x => x.id === item.id))

  const mappedItems = newGraffitis.map(item => {
    const returnedItem = {
      id: item.id,
      marketHashNamePtBR: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
      marketHashNameEn: graffiti_info?.find(x => x?.id === item?.id)?.name || null,
    }
    return returnedItem
  })

  item_name_graffiti = mappedItems
}

// ---------- Crates (crates-info + item-name) ----------

const getCratesData = async (options = {}) => {
  const {
    useLocalFile = true,
    localFilePath,
    crateIds,
    collectionIds,
    id,
    idMin,
    idMax,
  } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'en', 'crates.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json',
  })

  let newCrates = data

  if (crateIds && crateIds.length) {
    newCrates = data.filter(d => crateIds.includes(d?.id))
  } else if (collectionIds && collectionIds.length) {
    newCrates = data.filter(
      d => d?.collections && collectionIds.includes(d?.collections[0]?.id),
    )
  } else if (id != null || idMin != null || idMax != null) {
    newCrates = filterByIdRange(data, { id, idMin, idMax })
  } else {
    newCrates = data.filter(d => {
      const n = getNumericId(d)
      return !Number.isNaN(n) && n >= 4964
    })
  }

  const mappedCrates = newCrates.map(crate => {
    const returnedCrate = {
      id: crate.id,
      name: crate.name,
      description: crate.description,
      type: crate.type,
      contains: crate.contains.map(x => x?.id),
      containsRare: crate.contains_rare.map(x => x?.id),
      image: crate.image,
    }
    return returnedCrate
  })

  crate_info = mappedCrates
}

const getPortugueseNamesCrates = async (options = {}) => {
  const { useLocalFile = true, localFilePath } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'pt-BR', 'crates.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/pt-BR/crates.json',
  })

  const newCrates = data.filter(item => crate_info.some(x => x.id === item.id))

  const mappedItems = newCrates.map(item => {
    const returnedItem = {
      id: item.id,
      marketHashNamePtBR: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
      marketHashNameEn: crate_info?.find(x => x?.id === item?.id)?.name || null,
    }
    return returnedItem
  })

  item_name_crates = mappedItems
}

// ---------- Keychains (charms-info + item-name) ----------

const getKeychainsData = async (options = {}) => {
  const {
    useLocalFile = true,
    localFilePath,
    crateIds,
    collectionIds,
    id,
    idMin,
    idMax,
  } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'en', 'keychains.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/keychains.json',
  })

  let keychainItems = data

  if (crateIds && crateIds.length) {
    keychainItems = data.filter(
      d => d?.crates && crateIds.includes(d?.crates[0]?.id),
    )
  } else if (collectionIds && collectionIds.length) {
    keychainItems = data.filter(
      d => d?.collections && collectionIds.includes(d?.collections[0]?.id),
    )
  } else if (id != null || idMin != null || idMax != null) {
    keychainItems = filterByIdRange(data, { id, idMin, idMax })
  } else {
    keychainItems = data.filter(d => {
      const n = getNumericId(d)
      return !Number.isNaN(n) && n >= 34
    })
  }

  const mappedKeychains = keychainItems.map(keychain => {
    const returnedKeychain = {
      id: keychain.id,
      name: keychain.name,
      description: keychain.description,
      rarity: keychain.rarity.name,
      image: keychain.image,
    }
    return returnedKeychain
  })

  keychains_info = mappedKeychains
}

const getPortugueseNamesKeychains = async (options = {}) => {
  const { useLocalFile = true, localFilePath } = options

  const finalLocalPath =
    localFilePath || join(API_DIR, 'pt-BR', 'keychains.json')

  const data = await loadJson({
    useLocalFile,
    localFilePath: finalLocalPath,
    remoteUrl:
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/pt-BR/keychains.json',
  })

  const keychainItems = data.filter(item =>
    keychains_info.some(x => x.id === item.id),
  )

  const mappedItems = keychainItems.map(item => {
    const returnedItem = {
      id: item.id,
      marketHashNamePtBR: item.name.replaceAll('★ ', '').replaceAll('★', '').trim(),
      marketHashNameEn: keychains_info?.find(x => x?.id === item?.id)?.name || null,
    }
    return returnedItem
  })

  item_name_keychains = mappedItems
}

// ---------- CLI (stdin) ----------

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = question =>
  new Promise(resolve => rl.question(question, answer => resolve(answer.trim())))

const parseNumber = str => {
  const n = parseInt(str, 10)
  return Number.isNaN(n) ? null : n
}

const parseList = str =>
  str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

;(async () => {
  try {
    console.log('Select model:')
    console.log('  1) skins')
    console.log('  2) stickers')
    console.log('  3) crates')
    console.log('  4) graffiti')
    console.log('  5) keychains')

    const modelChoice = await ask('Enter option (1-5): ')
    let model = null

    if (modelChoice === '1') model = 'skins'
    else if (modelChoice === '2') model = 'stickers'
    else if (modelChoice === '3') model = 'crates'
    else if (modelChoice === '4') model = 'graffiti'
    else if (modelChoice === '5') model = 'keychains'
    else {
      console.error('Invalid model option.')
      rl.close()
      return
    }

    console.log('\nFilter type:')
    console.log('  1) default (same as your current code)')
    console.log('  2) by single numeric id')
    console.log('  3) by id range (min / max)')
    console.log('  4) by collection id(s)')
    console.log('  5) by crate id(s)')

    const filterChoice = await ask('Enter option (1-5): ')

    const options = {}

    if (filterChoice === '2') {
      const idStr = await ask('Enter numeric id (e.g. 4964 – numeric part only): ')
      const id = parseNumber(idStr)
      if (id == null) {
        console.error('Invalid id, falling back to default filter.')
      } else {
        options.id = id
      }
    } else if (filterChoice === '3') {
      const minStr = await ask(
        'Enter minimum numeric id (leave blank for no minimum): ',
      )
      const maxStr = await ask(
        'Enter maximum numeric id (leave blank for no maximum): ',
      )
      const idMin = minStr ? parseNumber(minStr) : null
      const idMax = maxStr ? parseNumber(maxStr) : null
      if (idMin != null) options.idMin = idMin
      if (idMax != null) options.idMax = idMax
    } else if (filterChoice === '4') {
      const colStr = await ask(
        'Enter collection id(s), comma-separated (e.g. collection-set-overpass-2024,...): ',
      )
      const collectionIds = parseList(colStr)
      if (collectionIds.length) options.collectionIds = collectionIds
    } else if (filterChoice === '5') {
      const crateStr = await ask(
        'Enter crate id(s), comma-separated (e.g. crate-4940,crate-4964,...): ',
      )
      const crateIds = parseList(crateStr)
      if (crateIds.length) options.crateIds = crateIds
    }

    console.log('\nUsing local files under:', API_DIR)
    console.log('Running...')

    if (model === 'skins') {
      await getItemsData(options)
      writeToFile(skin_info, 'items.json')
      await getPortugueseNames()
      writeToFile(item_name, 'item_names.json')
    } else if (model === 'stickers') {
      await getStickersData(options)
      writeToFile(sticker_info, 'stickers.json')
      await getPortugueseNamesStickers()
      writeToFile(item_name_stickers, 'stickers_names.json')
    } else if (model === 'crates') {
      await getCratesData(options)
      writeToFile(crate_info, 'crates.json')
      await getPortugueseNamesCrates()
      writeToFile(item_name_crates, 'crates_names.json')
    } else if (model === 'graffiti') {
      await getGraffitiData(options)
      writeToFile(graffiti_info, 'graffiti.json')
      await getPortugueseNamesGraffiti()
      writeToFile(item_name_graffiti, 'graffiti_names.json')
    } else if (model === 'keychains') {
      await getKeychainsData(options)
      writeToFile(keychains_info, 'keychains.json')
      await getPortugueseNamesKeychains()
      writeToFile(item_name_keychains, 'keychains_names.json')
    }

    console.log('\nDone.')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    rl.close()
  }
})()
