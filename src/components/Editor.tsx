import { useEffect, useRef, useState } from "react"
import { major } from "./demo-major"
import { IAndCourse2, ICourseRange2, IOrCourse2, IRequiredCourse, IXofManyCourse, Requirement2, Section } from "./major2-type"

function cursorUp(cursor: CursorPos): CursorPos {
  if (cursor.length === 0) return []
  return [...cursor.slice(0,-1), Math.max(0, cursor[cursor.length - 1] - 1)]
}

function cursorRight(cursor: CursorPos, major: Requirement2[]): CursorPos {
  if (cursor.length === 0) return [0]
  const parentReq = getReq(cursor.slice(1), major[cursor[0]])
  if (cursor[0] <= major.length + 1 && parentReq !== false && parentReq.type !== "COURSE" && parentReq.type !== "RANGE" ) {
    return [...cursor, 0]
  } else {
    return cursor
  }
}

function getReq(cursor: CursorPos, req: Requirement2): Requirement2 | false {
  if (cursor.length === 0) return req
  else {
    if (req.type === "SECTION") {
      if (cursor[0] > req.requirements.length - 1) {
        return false
      } else {
        return getReq(cursor.slice(1), req.requirements[cursor[0]])
      }
    }
    else if (req.type !== "COURSE" && req.type !== "RANGE") {
      if (cursor[0] > req.courses.length - 1) {
        return false
      } else {
        return getReq(cursor.slice(1), req.courses[cursor[0]])
      }
    } else {
      return false
    }
  }
}

function cursorLeft(cursor: CursorPos): CursorPos {
  if (cursor.length >= 2) {
    return cursor.slice(0,-1) 
  } else {
    return cursor
  }
}

function currentChildCount(cursor: CursorPos, rootSectionReq: Requirement2) {
  const req = getReq(cursor.slice(0,-1), rootSectionReq)

  if (req === false) {
    throw new Error("cannot get children of an invalid cursor req")
  }

  if (req.type === "SECTION") {
    return req.requirements.length
  }
  else if (req.type === "XOM" || req.type === "AND" || req.type === "OR") {
    return req.courses.length
  } else {
    throw new Error("invalid cursor pos, would index into course or range")
  }

  // if (cursor.length === 0) throw new Error("can't get child count of root")
  // if (cursor.length === 1) return major.length
  // else {
  //   const req = major[cursor[0]]
  //   if (req.type === "SECTION") {
  //     return currentChildCount(cursor.slice(1), req.requirements)
  //   }
  //   else if (req.type !== "COURSE" && req.type !== "RANGE") {
  //     return currentChildCount(cursor.slice(1), req.courses)
  //   } else {
  //     throw new Error("invalid cursor pos, would index into course or range")
  //   }
  
  // major
  // if (cursor.length)
}

function cursorDownEndPos(cursor: CursorPos, major: Requirement2[]): number {
  if (cursor.length === 0) throw new Error("cannot act on an empty cursor")
  if (cursor.length === 1) {
    return Math.min(major.length, cursor[0] + 1)
  } else {
    const currentNodeChildren = currentChildCount(cursor.slice(1), major[cursor[0]])
    return Math.min(currentNodeChildren, cursor[cursor.length - 1] + 1)
  }
}

function cursorDown(cursor: CursorPos, major: Requirement2[]): CursorPos {
  if (cursor.length === 0) return []
  return [...cursor.slice(0,-1), cursorDownEndPos(cursor, major)]
}

// function insertAtCursor(cursor: CursorPos, major: Requirement2[]) {
//   if (cursor === []) throw new Error() {

//   }
// }

export function Editor() {

  // const json = major


  // const [majorState] = useState(major)
  const [cursor, setCursor] = useState([4])

  useEffect(()=>{
    const callback = (e: KeyboardEvent)=>{
      if (e.key === "ArrowUp") {
        setCursor(cursor => cursorUp(cursor))
        e.preventDefault()
      }

      if (e.key === "ArrowDown") {
        setCursor(cursor => cursorDown(cursor, major.requirementSections))
        e.preventDefault()
      }

      if (e.key === "ArrowRight") {
        setCursor(cursor => cursorRight(cursor, major.requirementSections))
      }

      if (e.key === "ArrowLeft") {
        setCursor(cursor => cursorLeft(cursor))
      }

    }
    document.body.addEventListener("keydown", callback)

    return ()=>{
      document.body.removeEventListener("keydown", callback)
    }
  })


  return <RenderReqsWithCursor requirements={major.requirementSections} cursor={cursor}/>
}


const WINDOW_NUDGE = 120

const Cursor = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if (ref.current !== null) {
      const root = document.getElementById("root")!
      
      const viewHeight = root.getBoundingClientRect().height
      const topVisible = root.scrollTop
      const bottomVisible = root.scrollTop + viewHeight

      

      const targetPos = root.scrollTop + ref.current.getBoundingClientRect().top

      document.getElementById("top-hanger")!.style.top = `${targetPos}px`

      const targetAboveZone = targetPos < topVisible 
      const targetBelowZone = targetPos > bottomVisible 

      if (targetAboveZone) {
        const scrollTarget = targetPos - WINDOW_NUDGE
        root.scroll({top: scrollTarget, behavior:"smooth"})
      } else if (targetBelowZone) {
        const scrollTarget = targetPos - viewHeight - WINDOW_NUDGE / 2
        root.scroll({top: scrollTarget, behavior:"smooth"})
      }

      // ref.current.scrollIntoView({behavior:"instant"})
    }
    return () => {
      // document.documentElement.scrollTop = document.documentElement.scrollTop + 0
    }
  }, [ref])

  return <div className="cursor" ref={ref}></div>
}

type CursorPos = number[]

const Section: React.FC<{section: Section, cursor: CursorPos}> = ({section, cursor}) => {
  return (<div className="container-req section">
    <p>{section.title}</p>
    <RenderReqsWithCursor requirements={section.requirements} cursor={cursor}/>
  </div>)
}


const Requirement: React.FC<{requirement: Requirement2, cursor: CursorPos}> = ({requirement, cursor}) => {
  switch (requirement.type) {
    case "XOM":
      return <RequirementXOM xom={requirement} cursor={cursor}/>
    case "AND":
      return <RequirementAnd and={requirement} cursor={cursor}/>
    case "OR":
      return <RequirementOr or={requirement} cursor={cursor}/>
    case "RANGE":
      return <RequirementRange range={requirement} cursor={cursor}/>
    case "COURSE":
      return <RequirementCourse course={requirement}/>
    case "SECTION":
      return <Section section={requirement} cursor={cursor}/>
  }
}

function RequirementCourse({course}: {course: IRequiredCourse}) {
  return <p className="course">{`COURSE: ${course.subject} ${course.classId}`}</p>
}

const RequirementXOM: React.FC<{xom: IXofManyCourse, cursor: CursorPos}> = ({xom, cursor}) => {
  return (<div className="container-req">
    <p>XOM</p>
    <RenderReqsWithCursor requirements={xom.courses} cursor={cursor}/>
  </div>)
}

const RenderReqsWithCursor: React.FC<{requirements: Requirement2[], cursor: CursorPos}> = ({requirements, cursor}) => {
  if (requirements.length === 0 && cursor.length === 1 && cursor[0] === 0) {
    return <Cursor/>
  }

  return requirements.map((req, index) => {
    if (cursor.length >= 1 && cursor[0] === index) {
      if (cursor.length === 1) {
        return <>
          <Cursor/>
          <Requirement requirement={req} cursor={cursor.slice(1)}/>
        </>
      } else {
        return <Requirement requirement={req} cursor={cursor.slice(1)}/>
      }
    } else if (cursor.length === 1 && index === requirements.length - 1 && cursor[0] === index + 1) {
      return <>
        <Requirement requirement={req} cursor={cursor.slice(1)}/>
        <Cursor/>
      </>
    }
    else {
      return <Requirement requirement={req} cursor={[]}/>
    }
  })
}

const RequirementAnd: React.FC<{and: IAndCourse2, cursor: CursorPos}> = ({and, cursor}) => {
  return (<div className="container-req">
    <p>AND</p>
    <RenderReqsWithCursor requirements={and.courses} cursor={cursor}/>
  </div>)
}

const RequirementOr: React.FC<{or: IOrCourse2, cursor: CursorPos}> = ({or, cursor}) => {
  return (<div className="container-req">
    <p>OR</p>
    <RenderReqsWithCursor requirements={or.courses} cursor={cursor}/>
  </div>)
}

const RequirementRange: React.FC<{range: ICourseRange2, cursor: CursorPos}> = ({range}) => {
  return (<div className="range">
    <p>RANGE {range.subject} {range.idRangeStart}–{range.idRangeEnd}</p>
  </div>)
}