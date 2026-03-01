import { Faker, en, zh_CN } from '@faker-js/faker'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import path from 'node:path'
import { PriceMode, PrismaClient, Realm, RejectReasonType, ReviewStatus } from '../prisma-generated'
import { randomUUID } from 'node:crypto'

const faker = new Faker({ locale: [zh_CN, en] })
let prisma: PrismaClient | null = null

type Args = {
  city: string
  province?: string
  count: number
  merchants: number
  admins: number
  dryRun: boolean
}

type AmapPoi = {
  id: string
  name: string
  address?: string|string []
  location?: string
  pname?: string
  cityname?: string
  adname?: string
  tel?: string
}

type AmapTextSearchResponse = {
  status: string
  info: string
  infocode: string
  count?: string
  pois?: AmapPoi[]
}

const SHARED_TAGS: Array<{ name: string; category: string }> = [
  { name: '免费WiFi', category: 'facility' },
  { name: '停车场', category: 'facility' },
  { name: '24小时前台', category: 'facility' },
  { name: '商务出行', category: 'scene' },
  { name: '亲子友好', category: 'scene' },
  { name: '近地铁', category: 'feature' },
  { name: '可开发票', category: 'feature' },
  { name: '健身房', category: 'facility' },
  { name: '含早餐', category: 'feature' },
  { name: '高性价比', category: 'feature' },
]

const ROOM_NAME_POOL = ['标准大床房', '高级双床房', '商务大床房', '行政套房', '钟点房']
const BED_TYPE_POOL = ['1.5m*2.0m', '1.8m*2.0m', '1.2m*2.0m*2']
const DEFAULT_PASSWORD = 'Mock123456!'

function loadEnv() {
  const backendRoot = path.resolve(__dirname, '..')
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const files = [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env.local', '.env']
  for (const name of files) {
    dotenv.config({ path: path.join(backendRoot, name), override: false })
  }
}

function parseNumber(value: string | undefined, fallback: number, min: number) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(Math.floor(num), min)
}

function parseArgs(argv: string[]): Args {
  const argMap = new Map<string, string>()
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      argMap.set(key, next)
      i += 1
      continue
    }
    argMap.set(key, 'true')
  }
  return {
    city: argMap.get('city') ?? '上海',
    province: argMap.get('province') ?? undefined,
    count: parseNumber(argMap.get('count'), 20, 1),
    merchants: parseNumber(argMap.get('merchants'), 1, 1),
    admins: parseNumber(argMap.get('admins'), 1, 1),
    dryRun: argMap.get('dry-run') === 'true',
  }
}

function randomStatus() {
  const roll = faker.number.int({ min: 1, max: 100 })
  if (roll <= 75) return ReviewStatus.APPROVED
  if (roll <= 85) return ReviewStatus.PENDING
  if (roll <= 95) return ReviewStatus.DRAFT
  return ReviewStatus.REJECTED
}

function pickImageUrls(size: number) {
  return Array.from({ length: size }).map(
    () => `https://picsum.photos/seed/${faker.string.alphanumeric(11)}/400/200`,
  )
}

function parseLocation(location?: string) {
  if (!location) return null
  const [lngStr, latStr] = location.split(',')
  const lng = Number(lngStr)
  const lat = Number(latStr)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return { lng, lat }
}

function pickDistrictAddress(poi: AmapPoi) {
  const district = poi.adname || faker.location.county()
  const street = poi.address || faker.location.streetAddress()
  return { district, address: street }
}

function generateRoomTypes() {
  const count = faker.number.int({ min: 2, max: 4 })
  const rows: Array<{
    count: number
    name: string
    price: number
    priceMode: PriceMode
    duration: number
    bedType?: string
    maxGuests: number
    area?: number
    imageUrl: string
    sortOrder: number
    slots: string[]
  }> = []

  for (let i = 0; i < count; i += 1) {
    const isHourly = i === count - 1 && faker.number.float({ min: 0, max: 1, fractionDigits: 2 }) < 0.45
    const duration = isHourly ? faker.helpers.arrayElement([2, 3, 4]) : 1
    const roomCount = faker.number.int({ min: 6, max: 40 })
    const price = isHourly ? faker.number.int({ min: 88, max: 388 }) : faker.number.int({ min: 168, max: 1088 })
    rows.push({
      count: roomCount,
      name: isHourly ? '钟点房' : faker.helpers.arrayElement(ROOM_NAME_POOL.slice(0, 4)),
      price,
      priceMode: isHourly ? PriceMode.PER_HOUR : PriceMode.PER_NIGHT,
      duration,
      bedType: faker.helpers.arrayElement(BED_TYPE_POOL),
      maxGuests: faker.number.int({ min: 1, max: 4 }),
      area: faker.number.float({ min: 18, max: 68, fractionDigits: 1 }),
      imageUrl: `https://picsum.photos/seed/room-${faker.string.alphanumeric(10)}/800/600`,
      sortOrder: i + 1,
      slots: isHourly
        ? faker.helpers.arrayElements(['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'], faker.number.int({ min: 2, max: 4 }))
        : [],
    })
  }

  return rows
}

async function searchHotelPois(args: Args) {
  const key = process.env.AMAP_WEB_KEY
  if (!key) {
    throw new Error('缺少 AMAP_WEB_KEY 环境变量')
  }

  const size = 20
  const maxPages = 10
  const all: AmapPoi[] = []

  for (let page = 1; page <= maxPages && all.length < args.count; page += 1) {
    const url = new URL('https://restapi.amap.com/v3/place/text')
    url.searchParams.set('key', key)
    url.searchParams.set('keywords', '酒店')
    url.searchParams.set('city', args.city)
    url.searchParams.set('citylimit', 'true')
    url.searchParams.set('offset', String(size))
    url.searchParams.set('page', String(page))
    url.searchParams.set('extensions', 'base')
    url.searchParams.set('output', 'JSON')

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`高德接口请求失败: HTTP ${response.status}`)
    }
    const data = (await response.json()) as AmapTextSearchResponse
    if (data.status !== '1') {
      throw new Error(`高德接口错误: ${data.info}(${data.infocode})`)
    }
    const pois = (data.pois ?? []).filter((item) => item.location && item.name)
    all.push(...pois)
    if (pois.length < size) break
  }

  const dedup = new Map<string, AmapPoi>()
  for (const poi of all) {
    if (!dedup.has(poi.id)) dedup.set(poi.id, poi)
  }
  return Array.from(dedup.values()).slice(0, args.count)
}

async function ensureUsers(realm: Realm, amount: number) {
  if (!prisma) throw new Error('Prisma client not initialized')
  const users = []
  const suffix = randomUUID().slice(0, 6)
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 12)

  for (let i = 0; i < amount; i += 1) {
    const username = `${realm.toLowerCase()}_${suffix}_${i}`
    const email = `${username}@example.com`
    const user = await prisma.user.create({
      data: {
        realm,
        username,
        email,
        password,
        gender: faker.number.int({ min: 0, max: 2 }),
      },
    })
    if (realm === Realm.MERCHANT) {
      await prisma.merchantProfile.create({ data: { userId: user.id } })
    } else if (realm === Realm.ADMIN) {
      await prisma.adminProfile.create({ data: { userId: user.id } })
    } else {
      await prisma.mobileProfile.create({ data: { userId: user.id } })
    }
    users.push(user)
  }

  return users
}

async function ensureTags() {
  if (!prisma) throw new Error('Prisma client not initialized')
  for (const tag of SHARED_TAGS) {
    await prisma.hotelTag.upsert({
      where: { name: tag.name },
      create: tag,
      update: { category: tag.category },
    })
  }
  return prisma.hotelTag.findMany({
    where: {
      name: {
        in: SHARED_TAGS.map((item) => item.name),
      },
    },
  })
}

async function createHotelByPoi(params: {
  poi: AmapPoi
  merchantId: number
  adminIds: number[]
  tagIds: number[]
  fallbackProvince?: string
}) {
  if (!prisma) throw new Error('Prisma client not initialized')
  const { poi, merchantId, adminIds, tagIds, fallbackProvince } = params
  const status = randomStatus()
  const roomTypes = generateRoomTypes()
  const images = pickImageUrls(faker.number.int({ min: 3, max: 6 }))
  const location = parseLocation(poi.location)
  const { district, address } = pickDistrictAddress(poi)
  const cityName = poi.cityname || faker.location.city()
  const provinceName = poi.pname || fallbackProvince || faker.location.state()
  const hotelName = poi.name.trim()
  const infoNickname = `${hotelName}-v${faker.number.int({ min: 1, max: 99 })}`
  const selectedTagIds = faker.helpers.arrayElements(tagIds, faker.number.int({ min: 2, max: Math.min(5, tagIds.length) }))
  const isHomeAdEnabled = faker.datatype.boolean(0.4)
  const adminId = faker.helpers.arrayElement(adminIds)

  const result = await prisma.$transaction(async (tx) => {
    const hotel = await tx.hotel.create({
      data: {
        hotelNickname: `${hotelName}-${faker.string.alpha(4).toUpperCase()}`,
        merchantId,
        isHomeAdEnabled,
      },
    })

    const info = await tx.hotelInfo.create({
      data: {
        hotelId: hotel.id,
        infoNickname,
        name: hotelName,
        enName: faker.helpers.maybe(() => faker.company.name(), { probability: 0.55 }),
        starLevel: faker.number.int({ min: 2, max: 5 }),
        phone: poi.tel || `1${faker.string.numeric(10)}`,
        description: faker.lorem.paragraphs({ min: 1, max: 2 }),
        province: provinceName,
        city: cityName,
        district,
        address: Array.isArray(address) ? address.join(',') : address,
        openedAt: faker.date.past({ years: 20 }),
        reviewStatus: status,
        createdBy: merchantId,
        homeAdImage: isHomeAdEnabled
          ? `https://picsum.photos/seed/ad-${faker.string.alphanumeric(10)}/1200/500`
          : null,
      },
    })

    if (location) {
      await tx.$executeRaw`
        UPDATE "hotel_infos"
        SET "location_geog" = ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography
        WHERE "id" = ${info.id}
      `
    }

    await tx.hotelImage.createMany({
      data: images.map((url, index) => ({
        infoId: info.id,
        url,
        sortOrder: index + 1,
        caption: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }) ?? null,
      })),
    })

    for (const room of roomTypes) {
      const createdRoom = await tx.roomType.create({
        data: {
          infoId: info.id,
          count: room.count,
          name: room.name,
          price: room.price,
          priceMode: room.priceMode,
          duration: room.duration,
          bedType: room.bedType ?? null,
          maxGuests: room.maxGuests,
          area: room.area ?? null,
          imageUrl: room.imageUrl,
          sortOrder: room.sortOrder,
        },
      })
      if (room.slots.length > 0) {
        await tx.hourlyRoomSlot.createMany({
          data: room.slots.map((startTime) => ({
            roomTypeId: createdRoom.id,
            startTime,
          })),
          skipDuplicates: true,
        })
      }
    }

    if (selectedTagIds.length > 0) {
      await tx.hotelTagRelation.createMany({
        data: selectedTagIds.map((tagId) => ({
          infoId: info.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    if (status === ReviewStatus.APPROVED) {
      await tx.hotel.update({
        where: { id: hotel.id },
        data: { publishedInfoId: info.id },
      })
      await tx.reviewRecord.create({
        data: {
          hotelId: hotel.id,
          infoId: info.id,
          reviewerId: adminId,
          action: ReviewStatus.APPROVED,
        },
      })
    } else if (status === ReviewStatus.REJECTED) {
      await tx.reviewRecord.create({
        data: {
          hotelId: hotel.id,
          infoId: info.id,
          reviewerId: adminId,
          action: ReviewStatus.REJECTED,
          rejectReason: faker.helpers.arrayElement([
            RejectReasonType.INFO_INCOMPLETE,
            RejectReasonType.INFO_INACCURATE,
            RejectReasonType.IMAGE_QUALITY,
            RejectReasonType.PRICE_ABNORMAL,
            RejectReasonType.DUPLICATE,
            RejectReasonType.POLICY_VIOLATION,
          ]),
        },
      })
    }

    return {
      hotelId: hotel.id,
      infoId: info.id,
      status,
      name: hotelName,
      location,
    }
  })

  return result
}

function printUsage() {
  console.log(`
Mock data CLI
Usage:
  pnpm --filter backend exec ts-node scripts/mock-cli.ts [options]

Options:
  --city <name>          城市名，默认: 上海
  --province <name>      省份名（可选）
  --count <n>            生成酒店数量，默认: 20
  --merchants <n>        生成商户账号数量，默认: 1
  --admins <n>           生成管理员账号数量，默认: 1
  --dry-run              仅拉取并打印POI，不写数据库
`)
}

async function main() {
  loadEnv()

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage()
    return
  }

  const args = parseArgs(process.argv.slice(2))
  console.log('[mock-cli] params:', args)

  const pois = await searchHotelPois(args)
  if (pois.length === 0) {
    throw new Error('未从高德获取到酒店POI，请检查 city 参数或 key 配置')
  }
  console.log(`[mock-cli] fetched poi: ${pois.length}`)

  if (args.dryRun) {
    for (const item of pois) {
      console.log(`${item.name} | ${item.location ?? '-'} | ${item.address ?? '-'}`)
    }
    return
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('缺少 DATABASE_URL 环境变量')
  }

  prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  })

  const [merchants, admins, tags] = await Promise.all([
    ensureUsers(Realm.MERCHANT, args.merchants),
    ensureUsers(Realm.ADMIN, args.admins),
    ensureTags(),
  ])
  const adminIds = admins.map((item) => item.id)
  const tagIds = tags.map((item) => item.id)

  const created: Array<{ hotelId: number; infoId: number; status: ReviewStatus; name: string }> = []
  for (let i = 0; i < pois.length; i += 1) {
    const poi = pois[i]
    const merchant = merchants[i % merchants.length]
    const row = await createHotelByPoi({
      poi,
      merchantId: merchant.id,
      adminIds,
      tagIds,
      fallbackProvince: args.province,
    })
    created.push(row)
    console.log(
      `[mock-cli] #${i + 1}/${pois.length} hotel=${row.hotelId} info=${row.infoId} status=${row.status} name=${row.name}`,
    )
  }

  const statusCount = created.reduce<Record<ReviewStatus, number>>(
    (acc, row) => {
      acc[row.status] += 1
      return acc
    },
    {
      [ReviewStatus.DRAFT]: 0,
      [ReviewStatus.PENDING]: 0,
      [ReviewStatus.APPROVED]: 0,
      [ReviewStatus.REJECTED]: 0,
      [ReviewStatus.DEPRECATED]: 0,
    },
  )

  console.log('\n[mock-cli] done')
  console.log(`[mock-cli] created merchants=${merchants.length}, admins=${admins.length}, hotels=${created.length}`)
  console.log('[mock-cli] status distribution:', statusCount)
  console.log(`[mock-cli] default password for generated users: ${DEFAULT_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('[mock-cli] failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })
