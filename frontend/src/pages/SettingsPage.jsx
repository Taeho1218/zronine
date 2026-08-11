import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi, uploadApi } from '../api'
import { useAuth } from '../store/AuthContext'
import { useBusy } from '../lib/useBusy'
import { downscaleImage } from '../lib/imageResize'
import { getLocalCover, setLocalCover } from '../lib/localCover'
import Avatar from '../components/Avatar'
import WithdrawDialog from '../components/WithdrawDialog'
import { CheckIcon } from '../components/icons'
import './SettingsPage.css'

/** 서버 UserUpdateRequest 의 @Size(min = 2, max = 50) 와 같은 기준 */
const NICKNAME_MIN = 2
const NICKNAME_MAX = 50

/** 입력이 멈춘 뒤에만 중복확인을 부르도록 값을 지연시킨다. */
function useDebounced(value, ms = 450) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout, updateUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [instagramUrl, setInstagramUrl] = useState('')

  const [nickState, setNickState] = useState(null) // null | 'checking' | 'ok' | 'taken'
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }
  const [askWithdraw, setAskWithdraw] = useState(false)

  const [uploading, runUpload] = useBusy()
  const [saving, runSave] = useBusy()
  const [coverBusy, runCover] = useBusy()
  const [loggingOut, runLogout] = useBusy()

  useEffect(() => {
    userApi
      .me()
      .then((me) => {
        // 서버가 커버를 아직 안 내려주므로, 없으면 이 브라우저에 적어둔 값을 되살린다.
        // 처음 상태와 프로필을 같은 값으로 맞춰야 화면을 열자마자 "변경됨"이 되지 않는다.
        const cover = me.coverImageUrl ?? getLocalCover(me.userId)
        setProfile({ ...me, coverImageUrl: cover })
        setNickname(me.nickname ?? '')
        setImageUrl(me.profileImageUrl ?? null)
        setCoverUrl(cover)
        setInstagramUrl(me.instagramUrl ?? '')
      })
      .catch((err) => setMessage({ type: 'error', text: err.message }))
  }, [])

  const trimmed = nickname.trim()
  const unchangedNickname = profile != null && trimmed === profile.nickname
  const debouncedNickname = useDebounced(trimmed)

  useEffect(() => {
    // 지금 쓰고 있는 닉네임은 "이미 사용 중"이 아니라 "안 바꿈"이므로 확인하지 않는다.
    if (debouncedNickname.length < NICKNAME_MIN || unchangedNickname) {
      setNickState(null)
      return undefined
    }
    let alive = true
    setNickState('checking')
    userApi
      .checkNickname(debouncedNickname)
      .then((res) => alive && setNickState(res?.available ? 'ok' : 'taken'))
      .catch(() => alive && setNickState(null))
    return () => {
      alive = false
    }
  }, [debouncedNickname, unchangedNickname])

  const nicknameError = useMemo(() => {
    if (!trimmed) return '닉네임을 입력해주세요.'
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      return `닉네임은 ${NICKNAME_MIN}자 이상 ${NICKNAME_MAX}자 이하여야 해요.`
    }
    if (nickState === 'taken') return '이미 사용 중인 닉네임이에요.'
    return null
  }, [trimmed, nickState])

  function pickImage(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일을 다시 골라도 change 가 뜨도록 비운다
    if (!file) return

    runUpload(async () => {
      setMessage(null)
      try {
        const [url] = await uploadApi.images([file])
        setImageUrl(url)
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      }
    })
  }

  function pickCover(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    runCover(async () => {
      setMessage(null)
      try {
        // 커버는 폭이 넓어 원본이 그대로 올라가면 용량이 크다. 먼저 줄여서 올린다.
        const [url] = await uploadApi.images([await downscaleImage(file)])
        setCoverUrl(url)
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      }
    })
  }

  function save(e) {
    e.preventDefault()
    if (nicknameError) {
      setMessage({ type: 'error', text: nicknameError })
      return
    }

    runSave(async () => {
      setMessage(null)
      try {
        /*
         * 서버는 null 을 "변경하지 않음"으로, 빈 문자열을 "지우기"로 읽는다.
         * 그래서 사진을 뗀 경우에는 null 이 아니라 '' 를 보내야 기본 이미지로 돌아간다.
         */
        const updated = await userApi.updateMe({
          nickname: trimmed,
          profileImageUrl: imageUrl ?? '',
          instagramUrl: instagramUrl.trim(),
          coverImageUrl: coverUrl ?? '',
        })
        // 서버가 커버를 아직 안 돌려주므로, 돌아온 값이 없으면 방금 고른 값을 그대로 쓴다.
        const cover = updated.coverImageUrl ?? coverUrl
        setLocalCover(updated.userId ?? profile.userId, cover)
        setProfile({ ...updated, coverImageUrl: cover })
        // 헤더 아바타·닉네임도 바로 새 값으로 바뀌게 한다.
        updateUser({ nickname: updated.nickname, profileImageUrl: updated.profileImageUrl })
        setNickState(null)
        setMessage({ type: 'ok', text: '저장했어요.' })
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      }
    })
  }

  async function withdraw() {
    const result = await userApi.withdraw()
    setAskWithdraw(false)
    await logout()
    navigate('/', { replace: true })
    return result
  }

  if (!profile) {
    return (
      <div className="state">
        {message?.type === 'error' ? (
          <>
            <p className="state__title">설정을 불러오지 못했어요.</p>
            <p>{message.text}</p>
          </>
        ) : (
          <span className="spinner" />
        )}
      </div>
    )
  }

  const dirty =
    trimmed !== profile.nickname ||
    (imageUrl ?? '') !== (profile.profileImageUrl ?? '') ||
    (coverUrl ?? '') !== (profile.coverImageUrl ?? '') ||
    instagramUrl.trim() !== (profile.instagramUrl ?? '')

  return (
    <div className="settings page">
      <h1 className="settings__title">환경설정</h1>

      <form className="settings__card" onSubmit={save}>
        <h2 className="settings__section">프로필</h2>

        <div className="settings__photo">
          <Avatar user={{ ...profile, profileImageUrl: imageUrl }} size={84} />

          <div className="settings__photo-actions">
            <label className="btn btn--ghost settings__file">
              {uploading ? '올리는 중…' : '사진 변경'}
              <input type="file" accept="image/*" className="sr-only" onChange={pickImage} disabled={uploading} />
            </label>

            {imageUrl && (
              <button type="button" className="settings__plain" onClick={() => setImageUrl(null)}>
                기본 이미지로
              </button>
            )}
            <p className="field__help">JPG, PNG, GIF, WEBP · 5MB 이하</p>
          </div>
        </div>

        <label className="field settings__field">
          <span className="field__label">
            닉네임 <i className="req">*</i>
          </span>
          <div className="settings__input-wrap">
            <input
              className={`input ${nickState === 'ok' ? 'input--ok' : ''} ${nickState === 'taken' ? 'input--error' : ''}`}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="공구에서 사용할 이름"
              maxLength={NICKNAME_MAX}
            />
            {nickState === 'checking' && <span className="settings__status">확인 중</span>}
            {nickState === 'ok' && (
              <span className="settings__status settings__status--ok">
                <CheckIcon width={14} height={14} /> 사용 가능
              </span>
            )}
            {nickState === 'taken' && <span className="settings__status settings__status--bad">이미 사용 중</span>}
          </div>
          {nicknameError ? (
            <span className="field__error">{nicknameError}</span>
          ) : (
            <span className="field__help">
              {unchangedNickname ? '지금 쓰고 있는 닉네임이에요.' : `${NICKNAME_MIN}자 이상 ${NICKNAME_MAX}자 이하`}
            </span>
          )}
        </label>

        <div className="field settings__field">
          <span className="field__label">커버 사진</span>

          {/* 프로필 화면에서 보이는 것과 비슷한 비율로 미리 보여준다 */}
          <div
            className={`settings__cover ${coverUrl ? 'is-set' : ''}`}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
          >
            {!coverUrl && <span className="settings__cover-empty">기본 배경이 표시됩니다</span>}
          </div>

          <div className="settings__cover-actions">
            <label className="btn btn--ghost settings__file">
              {coverBusy ? '올리는 중…' : coverUrl ? '커버 사진 변경' : '커버 사진 올리기'}
              <input type="file" accept="image/*" className="sr-only" onChange={pickCover} disabled={coverBusy} />
            </label>

            {coverUrl && (
              <button type="button" className="settings__plain" onClick={() => setCoverUrl(null)}>
                기본 배경으로
              </button>
            )}
          </div>

          <span className="field__help">
            가로가 긴 사진이 잘 어울려요 (권장 1920×400 이상). 아래쪽에 이름이 얹히니 아래 1/3 에는 중요한
            피사체가 없는 사진이 좋습니다.
          </span>
        </div>

        <label className="field settings__field">
          <span className="field__label">인스타그램 주소</span>
          <input
            className="input"
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://www.instagram.com/..."
            maxLength={255}
          />
          <span className="field__help">프로필에 링크로 표시돼요. 비우면 표시하지 않습니다.</span>
        </label>

        {message && (
          <p className={message.type === 'ok' ? 'settings__ok' : 'field__error'}>{message.text}</p>
        )}

        <div className="settings__actions">
          <button type="submit" className="btn btn--primary" disabled={saving || uploading || coverBusy || !dirty}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>

      {/* 되돌리기 어려운 동작이라 저장 영역과 확실히 떼어 놓는다 */}
      <section className="settings__card">
        <h2 className="settings__section">계정</h2>

        <div className="settings__row">
          <div>
            <p className="settings__row-title">로그아웃</p>
            <p className="settings__row-desc">이 기기에서 로그인을 해제합니다.</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost settings__row-btn"
            onClick={() => runLogout(logout)}
            disabled={loggingOut}
          >
            {loggingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>

        <div className="settings__row settings__row--danger">
          <div>
            <p className="settings__row-title">회원 탈퇴</p>
            <p className="settings__row-desc">
              탈퇴하면 작성한 공구와 댓글을 더 이상 관리할 수 없어요.
            </p>
          </div>
          <button type="button" className="settings__withdraw" onClick={() => setAskWithdraw(true)}>
            탈퇴하기
          </button>
        </div>
      </section>

      {askWithdraw && (
        <WithdrawDialog
          nickname={profile.nickname}
          onConfirm={withdraw}
          onClose={() => setAskWithdraw(false)}
        />
      )}
    </div>
  )
}
