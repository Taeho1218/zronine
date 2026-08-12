import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { categoryApi, postApi, uploadApi } from '../api'
import Loading from '../components/Loading'
import ScreenBlocker from '../components/ScreenBlocker'
import { CheckIcon, CloseIcon, PlusIcon } from '../components/icons'
import { sortCategories } from '../lib/categories'
import { parsePrice } from '../lib/format'
import { getDraft, isBlankDraft, listDrafts, removeDraft, saveDraft as storeDraft } from '../lib/drafts'
import { useBusy } from '../lib/useBusy'
import { useAuth } from '../store/AuthContext'
import './PostWritePage.css'

const MAX_IMAGES = 5

const EMPTY = {
  postType: 'SELLER',
  // 실제 초기값은 아래에서 ?type= 쿼리로 덮어쓴다 (글쓰기 화면으로 바로 들어오는 링크용)
  title: '',
  content: '',
  imageUrls: [],
  productName: '',
  price: '',
  buyUrl: '',
  startDate: '',
  endDate: '',
  eventNote: '',
  categoryIds: [],
}

/** 서버의 LocalDateTime("2026-08-10T00:00:00") ↔ <input type="date">("2026-08-10") 변환 */
const toDateInput = (v) => (v ? String(v).slice(0, 10) : '')
const toLocalDateTime = (v, endOfDay = false) => (v ? `${v}T${endOfDay ? '23:59:59' : '00:00:00'}` : null)

export default function PostWritePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  /* 마이페이지 임시저장 탭에서 "이어서 쓰기" 로 들어온 경우, 그 칸을 지목해서 연다. */
  const draftParam = searchParams.get('draft')
  /*
   * 글 종류를 주소에 싣고 들어온 경우에만 값이 잡힌다 (오른쪽 아래 글쓰기 버튼에서 고르고 온 경우).
   * 헤더·푸터의 "글쓰기" 처럼 종류 없이 들어오면 null 이고, 그때는 임시저장에 적힌 종류를 따른다.
   */
  const typeParam = searchParams.get('type')
  const requestedType = typeParam === 'SELLER' || typeParam === 'GENERAL' ? typeParam : null
  const initialType = requestedType ?? 'SELLER'

  const [form, setForm] = useState({ ...EMPTY, postType: initialType })
  const [categories, setCategories] = useState([])
  const [uploading, runUpload] = useBusy()
  const [submitting, runSubmit] = useBusy()
  const [error, setError] = useState(null)
  const [savedDraft, setSavedDraft] = useState(false)
  // 지금 화면이 물고 있는 임시저장 칸. 있으면 "임시저장"을 다시 눌러도 새 칸을 만들지 않고 덮어쓴다.
  const [draftId, setDraftId] = useState(draftParam)
  // 수정 모드에서 기존 글을 받아오기 전. 빈 폼이 잠깐 보이면 "값이 날아갔나" 싶으므로 가려둔다.
  const [loadingPost, setLoadingPost] = useState(!!editId)
  const fileRef = useRef(null)

  const isSeller = form.postType === 'SELLER'
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  useEffect(() => {
    categoryApi
      .list()
      // 고르는 자리도 홈과 같은 차례로 늘어놓는다 (식품 → 화장품 → …)
      .then((list) => setCategories(sortCategories(list)))
      .catch(() => setCategories([]))
  }, [])

  // 수정 모드면 기존 값을 채우고, 새 글이면 남아있는 임시저장을 복원한다.
  useEffect(() => {
    if (editId) {
      setLoadingPost(true)
      postApi
        .detail(editId)
        .then((post) =>
          setForm({
            postType: post.postType,
            title: post.title ?? '',
            content: post.content ?? '',
            imageUrls: post.imageUrls ?? [],
            productName: post.productName ?? '',
            price: post.price == null ? '' : String(post.price),
            buyUrl: post.buyUrl ?? '',
            startDate: toDateInput(post.startDate),
            endDate: toDateInput(post.endDate),
            eventNote: post.eventNote ?? '',
            categoryIds: (post.categories ?? []).map((c) => c.categoryId),
          }),
        )
        .catch((err) => setError(err.message))
        .finally(() => setLoadingPost(false))
      return
    }

    /*
     * 이어서 쓰기로 지목해 들어왔으면 그 칸을, 그냥 들어왔으면 가장 최근에 임시저장한 글을 되살린다.
     * (전부 마이페이지 "임시저장" 탭에 남아 있으므로, 다른 글을 이어 쓰려면 거기서 고르면 된다)
     */
    const draft = draftParam ? getDraft(draftParam) : listDrafts(user?.userId)[0]
    if (!draft?.form) return

    setDraftId(draft.draftId)
    /*
     * 쓰던 내용은 되살리되, 글 종류만은 방금 고르고 들어온 값이 이긴다.
     * "셀러로 글쓰기" 를 고른 사람에게 지난번 유저글 임시저장의 종류가 씌워지면
     * 고른 게 무시된 것처럼 보이기 때문이다.
     */
    setForm({
      ...EMPTY,
      ...draft.form,
      postType: requestedType ?? draft.form.postType ?? EMPTY.postType,
    })
  }, [editId, draftParam])

  async function pickImages(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // 같은 파일을 다시 골라도 change 가 뜨도록 비운다
    if (files.length === 0) return

    const room = MAX_IMAGES - form.imageUrls.length
    if (room <= 0) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 올릴 수 있어요.`)
      return
    }

    runUpload(async () => {
      setError(null)
      try {
        const urls = await uploadApi.images(files.slice(0, room))
        set({ imageUrls: [...form.imageUrls, ...(Array.isArray(urls) ? urls : [urls])] })
      } catch (err) {
        setError(err.message)
      }
    })
  }

  function removeImage(url) {
    set({ imageUrls: form.imageUrls.filter((u) => u !== url) })
  }

  function toggleCategory(id) {
    set({
      categoryIds: form.categoryIds.includes(id)
        ? form.categoryIds.filter((x) => x !== id)
        : [...form.categoryIds, id],
    })
  }

  /** 쓰던 글을 이 브라우저에 담아둔다. 서버로는 나가지 않으므로 등록 전까지 아무에게도 안 보인다. */
  function saveDraft() {
    if (isBlankDraft(form)) {
      setError('임시저장할 내용이 없어요. 제목이나 내용을 먼저 적어주세요.')
      return
    }
    try {
      const saved = storeDraft(form, { draftId, userId: user?.userId })
      setDraftId(saved.draftId)
      setError(null)
      setSavedDraft(true)
      setTimeout(() => setSavedDraft(false), 2000)
    } catch {
      setError('임시저장에 실패했어요. 브라우저 저장 공간이 부족할 수 있어요.')
    }
  }

  /** 서버가 400 을 던지기 전에 시안의 필수 표시(*)와 같은 기준으로 먼저 막는다. */
  function validate() {
    if (!form.title.trim()) return '제목을 입력해주세요.'
    if (!form.content.trim()) return '상세 설명을 입력해주세요.'
    if (!isSeller) return null
    if (!form.startDate || !form.endDate) return '모집 기간을 선택해주세요.'
    if (form.endDate < form.startDate) return '모집 종료일은 시작일 이후여야 합니다.'
    if (form.categoryIds.length === 0) return '카테고리를 한 개 이상 선택해주세요.'
    return null
  }

  function submit(e) {
    e.preventDefault()
    const message = validate()
    if (message) {
      setError(message)
      return
    }

    // 일반글에 셀러 전용 값이 섞여 들어가면 서버가 GENERAL_POST_HAS_SELLER_FIELD 로 막으므로
    // 유저 글일 때는 셀러 필드를 아예 보내지 않는다.
    const payload = isSeller
      ? {
          postType: 'SELLER',
          title: form.title.trim(),
          content: form.content.trim(),
          imageUrls: form.imageUrls,
          productName: form.productName.trim() || null,
          price: parsePrice(form.price),
          buyUrl: form.buyUrl.trim() || null,
          startDate: toLocalDateTime(form.startDate),
          endDate: toLocalDateTime(form.endDate, true),
          eventNote: form.eventNote.trim() || null,
          categoryIds: form.categoryIds,
        }
      : {
          postType: 'GENERAL',
          title: form.title.trim(),
          content: form.content.trim(),
          imageUrls: form.imageUrls,
        }

    // 등록은 누른 만큼 글이 생길 수 있어 중복 차단이 특히 중요하다.
    runSubmit(async () => {
      setError(null)
      try {
        const saved = editId ? await postApi.update(editId, payload) : await postApi.create(payload)
        // 글로 올라갔으니 임시저장 칸은 비운다 (마이페이지 목록에서도 사라진다)
        removeDraft(draftId)
        navigate(`/posts/${saved?.postId ?? editId}`)
      } catch (err) {
        setError(err.message)
      }
    })
  }

  const uploader = (
    <div className={`uploader ${isSeller ? 'uploader--square' : 'uploader--wide'}`}>
      {/* 업로드 중에는 파일 선택창을 다시 열지 못하게 막는다 */}
      <button
        type="button"
        className="uploader__drop"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <span className="uploader__plus">
          <PlusIcon width={22} height={22} />
        </span>
        <span className="uploader__title">사진 첨부</span>
        <span className="uploader__help">
          {isSeller ? `대표 이미지를 올려주세요 (최대 ${MAX_IMAGES}장)` : '이미지를 올려주세요 (선택)'}
        </span>
        {uploading && <span className="uploader__status">올리는 중…</span>}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={pickImages}
      />

      {form.imageUrls.length > 0 && (
        <ul className="uploader__thumbs">
          {form.imageUrls.map((url, i) => (
            <li key={url} className="uploader__thumb">
              <img src={url} alt={`첨부 이미지 ${i + 1}`} />
              <button type="button" onClick={() => removeImage(url)} aria-label="이미지 삭제">
                <CloseIcon width={13} height={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  if (loadingPost) return <Loading message="글을 불러오는 중…" />

  return (
    <div className={`write page ${isSeller ? '' : 'write--narrow'}`}>
      {/*
        등록은 사진이 여러 장이면 몇 초씩 걸리는데, 그동안 화면이 그대로라 눌린 건지 알기 어렵다.
        버튼 글씨만 바꾸는 대신 화면을 덮어, 진행 중이라는 걸 알리면서 다시 누르거나
        다른 곳으로 넘어가는 것도 함께 막는다. (로그인·로그아웃과 같은 표시)
      */}
      {submitting && <ScreenBlocker message={editId ? '글을 수정하는 중…' : '글을 등록하는 중…'} />}

      <form onSubmit={submit}>
        <div className="write__top">
          <h1 className="write__title">{isSeller ? '공구 열기' : '글쓰기'}</h1>

          {/* 셀러글 ↔ 일반글은 작성 시점에만 고를 수 있다 (서버가 수정 시 postType 을 받지 않음) */}
          {!editId && (
            <div className="segmented" role="tablist" aria-label="글 종류">
              {[
                { key: 'SELLER', label: '셀러' },
                { key: 'GENERAL', label: '유저' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={form.postType === t.key}
                  className={`segmented__btn ${form.postType === t.key ? 'is-active' : ''}`}
                  onClick={() => set({ postType: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isSeller && (
          <p className="write__notice">
            <span className="write__notice-icon">!</span>
            유저 글은 사진·제목·상세설명만으로 간단히 올릴 수 있어요.
          </p>
        )}

        {isSeller ? (
          <div className="write__grid">
            {uploader}

            <div className="write__fields">
              <label className="field">
                <span className="field__label">
                  한줄설명 (제목) <i className="req">*</i>
                </span>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="예) 에티오피아 예가체프 G1 원두 1kg 공동구매"
                  maxLength={255}
                />
              </label>

              <div className="write__row">
                <div className="field">
                  <span className="field__label">
                    기간 <i className="req">*</i>
                  </span>
                  <div className="daterange">
                    <input
                      type="date"
                      className="daterange__input"
                      value={form.startDate}
                      onChange={(e) => set({ startDate: e.target.value })}
                      aria-label="모집 시작일"
                    />
                    <span className="daterange__sep">~</span>
                    <input
                      type="date"
                      className="daterange__input"
                      value={form.endDate}
                      min={form.startDate || undefined}
                      onChange={(e) => set({ endDate: e.target.value })}
                      aria-label="모집 종료일"
                    />
                  </div>
                </div>

                <label className="field">
                  <span className="field__label">물건이름</span>
                  <input
                    className="input"
                    value={form.productName}
                    onChange={(e) => set({ productName: e.target.value })}
                    placeholder="예가체프 G1 원두 1kg"
                    maxLength={100}
                  />
                </label>
              </div>

              <div className="write__row">
                <label className="field">
                  <span className="field__label">가격</span>
                  {/* 값에 "원"을 붙이면 백스페이스가 접미사만 지웠다가 다시 붙어 숫자를 못 지운다.
                      그래서 입력값은 콤마까지만 넣고 단위는 별도 요소로 얹는다. */}
                  <div className="pricefield">
                    <input
                      className="input pricefield__input"
                      inputMode="numeric"
                      value={form.price === '' ? '' : Number(form.price).toLocaleString('ko-KR')}
                      onChange={(e) => set({ price: parsePrice(e.target.value) ?? '' })}
                      placeholder="미정이면 비워두세요"
                    />
                    {form.price !== '' && <span className="pricefield__unit">원</span>}
                  </div>
                </label>

                <label className="field">
                  <span className="field__label">구매링크</span>
                  <input
                    className="input"
                    type="url"
                    value={form.buyUrl}
                    onChange={(e) => set({ buyUrl: e.target.value })}
                    placeholder="https://..."
                    maxLength={512}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">공구 이벤트</span>
                <textarea
                  className="textarea write__event"
                  rows={3}
                  value={form.eventNote}
                  onChange={(e) => set({ eventNote: e.target.value })}
                  placeholder={'선착순 혜택 | 선착순 20명 스틱 30포 증정 | 결제 완료 순서 기준\n구매인증 이벤트 | 10명 추첨을 통해 스틱 30포 증정'}
                  maxLength={255}
                />
                {/* 상세 페이지에서 이 규칙대로 카드를 쪼갠다. 비워 두면 이벤트 칸 자체가 안 나온다. */}
                <span className="field__help">
                  한 줄에 하나씩 · <code>라벨 | 제목 | 설명</code> 순서로 적으면 카드로 나뉘어요. 안 적으면 상세
                  페이지에 이벤트 칸이 표시되지 않습니다.
                </span>
              </label>

              <div className="field">
                <span className="field__label">
                  카테고리 선택 <i className="req">*</i>
                </span>
                <div className="write__cats">
                  {categories.map((c) => {
                    const on = form.categoryIds.includes(c.categoryId)
                    return (
                      <button
                        key={c.categoryId}
                        type="button"
                        className={`catchip ${on ? 'is-on' : ''}`}
                        onClick={() => toggleCategory(c.categoryId)}
                        aria-pressed={on}
                      >
                        {on && <CheckIcon width={14} height={14} />}
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          uploader
        )}

        {/* 유저 글은 시안 순서가 사진 → 제목 → 상세 설명이라 제목을 여기서 그린다.
            (셀러 글의 제목은 위 2단 그리드의 "한줄설명" 필드다) */}
        {!isSeller && (
          <label className="field write__content">
            {/* 유저 글도 제목 없이는 등록되지 않는다 (validate 가 먼저 막는다) */}
            <span className="field__label">
              제목 <i className="req">*</i>
            </span>
            <input
              className="input"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="제목을 입력하세요"
              maxLength={255}
            />
          </label>
        )}

        <label className="field write__content">
          {/* 셀러 글이든 유저 글이든 내용 없이는 등록되지 않는다 (validate 가 먼저 막는다) */}
          <span className="field__label">
            상세 설명 <i className="req">*</i>
          </span>
          <textarea
            className="textarea"
            value={form.content}
            onChange={(e) => set({ content: e.target.value })}
            placeholder={
              isSeller
                ? '상품 상태, 배송 방법, 분쇄도 옵션 등 자세한 내용을 적어주세요.'
                : '내용을 자유롭게 적어주세요.'
            }
            rows={isSeller ? 6 : 8}
          />
        </label>

        {error && <p className="field__error write__error">{error}</p>}

        <div className="write__actions">
          {savedDraft && (
            <span className="write__saved">
              임시저장했어요 ·{' '}
              <Link className="write__saved-link" to="/mypage?tab=drafts">
                마이페이지에서 보기
              </Link>
            </span>
          )}
          {/*
            수정 중에는 임시저장을 두지 않는다. 여기서 담아두면 "어떤 글을 고치던 중" 이라는 사실이 빠져,
            나중에 그 임시저장을 등록할 때 고치려던 글이 그대로 남은 채 새 글이 하나 더 생긴다.
          */}
          {!editId && (
            <button type="button" className="btn btn--ghost" onClick={saveDraft}>
              임시저장
            </button>
          )}
          <button
            type="submit"
            className="btn btn--primary write__submit"
            disabled={submitting || uploading}
          >
            {submitting ? '등록 중…' : editId ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
