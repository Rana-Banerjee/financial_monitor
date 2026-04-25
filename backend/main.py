from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Enum,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from enum import Enum as PyEnum
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


def parse_date_str(v):
    if v is None:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        return datetime.strptime(v, "%Y-%m-%d").date()
    return None


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./financial_monitor.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PropertyType(PyEnum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    PLOT = "plot"
    UNDER_CONSTRUCTION = "under_construction"


class PropertyStatus(PyEnum):
    READY_TO_MOVE_IN = "ready_to_move_in"
    UNDER_CONSTRUCTION = "under_construction"
    RENTAL = "rental"


class Person(Base):
    __tablename__ = "persons"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)


class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    name = Column(String, nullable=False)
    property_type = Column(Enum(PropertyType), nullable=False)
    property_status = Column(
        Enum(PropertyStatus), default=PropertyStatus.READY_TO_MOVE_IN
    )
    purchase_date = Column(Date, nullable=True)
    possession_date = Column(Date, nullable=True)
    purchase_price = Column(Float, default=0)
    current_valuation = Column(Float, default=0)
    appreciation_rate = Column(Float, default=0)
    is_primary_residence = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now())
    last_updated = Column(DateTime, default=lambda: datetime.now())

    loans = relationship("Loan", back_populates="property")
    cashflow_schedules = relationship("CashflowSchedule", back_populates="property")
    events = relationship("Event", back_populates="property")
    installments = relationship("Installment", back_populates="property")
    other_expenses = relationship("OtherExpense", back_populates="property")


class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    principal = Column(Float, default=0)
    interest_rate = Column(Float, default=0)
    tenure_months = Column(Integer, default=0)
    emi_amount = Column(Float, default=0)
    start_date = Column(Date, nullable=True)
    pre_emi = Column(Integer, default=0)

    property = relationship("Property", back_populates="loans")
    overdraft_account = relationship(
        "OverdraftAccount", back_populates="loan", uselist=False
    )


class Installment(Base):
    __tablename__ = "installments"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, default=0)
    date = Column(Date, nullable=True)
    paid_by = Column(String, default="individual")
    is_interest = Column(Integer, default=0)
    is_completed = Column(Integer, default=0)

    property = relationship("Property", back_populates="installments")


class OtherExpense(Base):
    __tablename__ = "other_expenses"
    id = Column(String, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, default=0)
    date = Column(Date, nullable=True)
    paid_by = Column(String, default="individual")
    is_completed = Column(Integer, default=0)

    property = relationship("Property", back_populates="other_expenses")


class CashflowSchedule(Base):
    __tablename__ = "cashflow_schedules"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, default=0)
    frequency = Column(String, default="monthly")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_income = Column(Integer, default=0)

    property = relationship("Property", back_populates="cashflow_schedules")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_date = Column(Date, nullable=True)
    description = Column(String, nullable=True)

    property = relationship("Property", back_populates="events")


class OverdraftAccount(Base):
    __tablename__ = "overdraft_accounts"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    overdraft_amount = Column(Float, default=0)
    impact_type = Column(String, default="reduce_emi")

    loan = relationship("Loan", back_populates="overdraft_account")


Base.metadata.create_all(bind=engine)


class PersonCreate(BaseModel):
    name: str


class PersonResponse(PersonCreate):
    id: int


class LoanCreate(BaseModel):
    principal: float = 0
    interest_rate: float = 0
    tenure_months: int = 0
    emi_amount: float = 0
    start_date: Optional[date] = None
    pre_emi: bool = False
    overdraft_account: Optional["OverdraftAccountCreate"] = None


class OverdraftAccountCreate(BaseModel):
    overdraft_amount: float = 0
    impact_type: str = "reduce_emi"


class CashflowScheduleCreate(BaseModel):
    name: str
    amount: float = 0
    frequency: str = "monthly"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_income: bool = False


class EventCreate(BaseModel):
    event_type: str
    event_date: Optional[date] = None
    description: Optional[str] = None


class OtherExpenseCreate(BaseModel):
    id: str
    name: str
    amount: float = 0
    date: Optional[str] = None
    paid_by: str = "individual"
    is_completed: bool = False


class InstallmentCreate(BaseModel):
    name: str
    amount: float = 0
    date: Optional[str] = None
    paid_by: str = "individual"
    is_interest: bool = False
    is_completed: bool = False


class PropertyCreate(BaseModel):
    name: str
    property_type: PropertyType
    property_status: PropertyStatus = PropertyStatus.READY_TO_MOVE_IN
    purchase_date: Optional[date] = None
    possession_date: Optional[date] = None
    purchase_price: float = 0
    current_valuation: float = 0
    appreciation_rate: float = 0
    is_primary_residence: bool = False
    loan: Optional[LoanCreate] = None
    cashflow_schedules: Optional[List[CashflowScheduleCreate]] = []
    events: Optional[List[EventCreate]] = []
    installments: Optional[List[InstallmentCreate]] = []
    other_expenses: Optional[List[OtherExpenseCreate]] = []


class PropertyResponse(PropertyCreate):
    id: int
    last_updated: Optional[datetime] = None
    loan: Optional[LoanCreate] = None
    cashflow_schedules: List[CashflowScheduleCreate] = []
    events: List[EventCreate] = []
    installments: List[InstallmentCreate] = []
    other_expenses: List[OtherExpenseCreate] = []


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/persons/", response_model=PersonResponse)
def create_person(person: PersonCreate, db: Session = Depends(get_db)):
    db_person = Person(name=person.name)
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


@app.get("/persons/", response_model=List[PersonResponse])
def get_persons(db: Session = Depends(get_db)):
    return db.query(Person).all()


@app.post("/properties/", response_model=PropertyResponse)
def create_property(property: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(
        name=property.name,
        property_type=property.property_type,
        property_status=property.property_status,
        purchase_date=property.purchase_date,
        possession_date=property.possession_date,
        purchase_price=property.purchase_price,
        current_valuation=property.current_valuation,
        appreciation_rate=property.appreciation_rate,
        is_primary_residence=int(property.is_primary_residence),
        person_id=1,
        created_at=datetime.now(),
        last_updated=datetime.now(),
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)

    if property.loan:
        db_loan = Loan(
            property_id=db_property.id,
            principal=property.loan.principal,
            interest_rate=property.loan.interest_rate,
            tenure_months=property.loan.tenure_months,
            emi_amount=property.loan.emi_amount,
            start_date=property.loan.start_date,
            pre_emi=int(property.loan.pre_emi),
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)

        if property.loan.overdraft_account:
            db_overdraft = OverdraftAccount(
                loan_id=db_loan.id,
                overdraft_amount=property.loan.overdraft_account.overdraft_amount,
                impact_type=property.loan.overdraft_account.impact_type,
            )
            db.add(db_overdraft)

    for cf in property.cashflow_schedules:
        db_cf = CashflowSchedule(
            property_id=db_property.id,
            name=cf.name,
            amount=cf.amount,
            frequency=cf.frequency,
            start_date=cf.start_date,
            end_date=cf.end_date,
            is_income=int(cf.is_income),
        )
        db.add(db_cf)

    for event in property.events:
        db_event = Event(
            property_id=db_property.id,
            event_type=event.event_type,
            event_date=event.event_date,
            description=event.description,
        )
        db.add(db_event)

    for inst in property.installments:
        db_inst = Installment(
            property_id=db_property.id,
            name=inst.name,
            amount=inst.amount,
            date=parse_date_str(inst.date),
            paid_by=inst.paid_by,
            is_interest=int(inst.is_interest),
            is_completed=int(inst.is_completed),
        )
        db.add(db_inst)

    for exp in property.other_expenses or []:
        db_exp = OtherExpense(
            property_id=db_property.id,
            id=exp.id,
            name=exp.name,
            amount=exp.amount,
            date=parse_date_str(exp.date),
            paid_by=exp.paid_by,
            is_completed=int(exp.is_completed),
        )
        db.add(db_exp)

    db.commit()

    loan_data = None
    if property.loan:
        od_data = None
        if property.loan.overdraft_account:
            od_data = OverdraftAccountCreate(
                overdraft_amount=property.loan.overdraft_account.overdraft_amount,
                impact_type=property.loan.overdraft_account.impact_type,
            )
        loan_data = LoanCreate(
            principal=db_loan.principal,
            interest_rate=db_loan.interest_rate,
            tenure_months=db_loan.tenure_months,
            emi_amount=db_loan.emi_amount,
            start_date=db_loan.start_date,
            pre_emi=bool(db_loan.pre_emi),
            overdraft_account=od_data,
        )

    db_cfs = (
        db.query(CashflowSchedule)
        .filter(CashflowSchedule.property_id == db_property.id)
        .all()
    )

    db_insts = (
        db.query(Installment).filter(Installment.property_id == db_property.id).all()
    )

    return PropertyResponse(
        id=db_property.id,
        name=db_property.name,
        property_type=db_property.property_type,
        property_status=db_property.property_status,
        purchase_date=db_property.purchase_date,
        possession_date=db_property.possession_date,
        purchase_price=db_property.purchase_price,
        current_valuation=db_property.current_valuation,
        appreciation_rate=db_property.appreciation_rate,
        is_primary_residence=bool(db_property.is_primary_residence),
        last_updated=db_property.last_updated,
        loan=loan_data,
        cashflow_schedules=[
            CashflowScheduleCreate(
                name=cf.name,
                amount=cf.amount,
                frequency=cf.frequency,
                start_date=cf.start_date,
                end_date=cf.end_date,
                is_income=bool(cf.is_income),
            )
            for cf in db_cfs
        ],
        events=[],
        installments=[
            InstallmentCreate(
                name=inst.name,
                amount=inst.amount,
                date=str(inst.date) if inst.date else None,
                paid_by=inst.paid_by,
                is_interest=bool(inst.is_interest),
                is_completed=bool(inst.is_completed),
            )
            for inst in db_insts
        ],
        other_expenses=[],
    )


@app.get("/properties/{property_id}", response_model=PropertyResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    p = db.query(Property).filter(Property.id == property_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Property not found")

    loans = db.query(Loan).filter(Loan.property_id == p.id).all()
    cashflow_schedules = (
        db.query(CashflowSchedule).filter(CashflowSchedule.property_id == p.id).all()
    )
    events = db.query(Event).filter(Event.property_id == p.id).all()
    installments = db.query(Installment).filter(Installment.property_id == p.id).all()
    other_expenses = (
        db.query(OtherExpense).filter(OtherExpense.property_id == p.id).all()
    )

    loan_data = None
    if loans:
        l = loans[0]
        od_data = None
        overdraft = (
            db.query(OverdraftAccount).filter(OverdraftAccount.loan_id == l.id).first()
        )
        if overdraft:
            od_data = OverdraftAccountCreate(
                overdraft_amount=overdraft.overdraft_amount,
                impact_type=overdraft.impact_type,
            )
        loan_data = LoanCreate(
            principal=l.principal,
            interest_rate=l.interest_rate,
            tenure_months=l.tenure_months,
            emi_amount=l.emi_amount,
            start_date=l.start_date,
            pre_emi=bool(l.pre_emi),
            overdraft_account=od_data,
        )

    return PropertyResponse(
        id=p.id,
        name=p.name,
        property_type=p.property_type,
        property_status=p.property_status,
        purchase_date=p.purchase_date,
        possession_date=p.possession_date,
        purchase_price=p.purchase_price,
        current_valuation=p.current_valuation,
        appreciation_rate=p.appreciation_rate,
        is_primary_residence=bool(p.is_primary_residence),
        last_updated=p.last_updated,
        loan=loan_data,
        cashflow_schedules=[
            CashflowScheduleCreate(
                name=cf.name,
                amount=cf.amount,
                frequency=cf.frequency,
                start_date=cf.start_date,
                end_date=cf.end_date,
                is_income=bool(cf.is_income),
            )
            for cf in cashflow_schedules
        ],
        events=[
            EventCreate(
                event_type=e.event_type,
                event_date=e.event_date,
                description=e.description,
            )
            for e in events
        ],
        installments=[
            InstallmentCreate(
                name=inst.name,
                amount=inst.amount,
                date=str(inst.date) if inst.date else None,
                paid_by=inst.paid_by,
                is_interest=bool(inst.is_interest),
                is_completed=bool(inst.is_completed),
            )
            for inst in installments
        ],
        other_expenses=[
            OtherExpenseCreate(
                id=exp.id,
                name=exp.name,
                amount=exp.amount,
                date=str(exp.date) if exp.date else None,
                paid_by=exp.paid_by,
                is_completed=bool(exp.is_completed),
            )
            for exp in other_expenses
        ],
    )


@app.put("/properties/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int, property: PropertyCreate, db: Session = Depends(get_db)
):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")

    db_property.name = property.name
    db_property.property_type = property.property_type
    db_property.property_status = property.property_status
    db_property.purchase_date = property.purchase_date
    db_property.possession_date = property.possession_date
    db_property.purchase_price = property.purchase_price
    db_property.current_valuation = property.current_valuation
    db_property.appreciation_rate = property.appreciation_rate
    db_property.is_primary_residence = int(property.is_primary_residence)
    db_property.last_updated = datetime.now()

    db.query(Loan).filter(Loan.property_id == property_id).delete()
    db.query(CashflowSchedule).filter(
        CashflowSchedule.property_id == property_id
    ).delete()
    db.query(Event).filter(Event.property_id == property_id).delete()
    db.query(Installment).filter(Installment.property_id == property_id).delete()
    db.query(OtherExpense).filter(OtherExpense.property_id == property_id).delete()

    if property.loan:
        db_loan = Loan(
            property_id=property_id,
            principal=property.loan.principal,
            interest_rate=property.loan.interest_rate,
            tenure_months=property.loan.tenure_months,
            emi_amount=property.loan.emi_amount,
            start_date=property.loan.start_date,
            pre_emi=int(property.loan.pre_emi),
        )
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)

        if property.loan.overdraft_account:
            db_overdraft = OverdraftAccount(
                loan_id=db_loan.id,
                overdraft_amount=property.loan.overdraft_account.overdraft_amount,
                impact_type=property.loan.overdraft_account.impact_type,
            )
            db.add(db_overdraft)

    for cf in property.cashflow_schedules:
        db_cf = CashflowSchedule(
            property_id=property_id,
            name=cf.name,
            amount=cf.amount,
            frequency=cf.frequency,
            start_date=cf.start_date,
            end_date=cf.end_date,
            is_income=int(cf.is_income),
        )
        db.add(db_cf)

    for event in property.events:
        db_event = Event(
            property_id=property_id,
            event_type=event.event_type,
            event_date=event.event_date,
            description=event.description,
        )
        db.add(db_event)

    for inst in property.installments:
        db_inst = Installment(
            property_id=property_id,
            name=inst.name,
            amount=inst.amount,
            date=parse_date_str(inst.date),
            paid_by=inst.paid_by,
            is_interest=int(inst.is_interest),
            is_completed=int(inst.is_completed),
        )
        db.add(db_inst)

    for exp in property.other_expenses or []:
        db_exp = OtherExpense(
            property_id=property_id,
            id=exp.id,
            name=exp.name,
            amount=exp.amount,
            date=parse_date_str(exp.date),
            paid_by=exp.paid_by,
            is_completed=int(exp.is_completed),
        )
        db.add(db_exp)

    db.commit()
    db.refresh(db_property)

    loan_data = None
    if property.loan:
        od_data = None
        if property.loan.overdraft_account:
            od_data = OverdraftAccountCreate(
                overdraft_amount=property.loan.overdraft_account.overdraft_amount,
                impact_type=property.loan.overdraft_account.impact_type,
            )
        loan_data = LoanCreate(
            principal=property.loan.principal,
            interest_rate=property.loan.interest_rate,
            tenure_months=property.loan.tenure_months,
            emi_amount=property.loan.emi_amount,
            start_date=property.loan.start_date,
            pre_emi=property.loan.pre_emi,
            overdraft_account=od_data,
        )

    db_cfs = (
        db.query(CashflowSchedule)
        .filter(CashflowSchedule.property_id == property_id)
        .all()
    )

    db_insts = (
        db.query(Installment).filter(Installment.property_id == property_id).all()
    )

    return PropertyResponse(
        id=db_property.id,
        name=db_property.name,
        property_type=db_property.property_type,
        property_status=db_property.property_status,
        purchase_date=db_property.purchase_date,
        possession_date=db_property.possession_date,
        purchase_price=db_property.purchase_price,
        current_valuation=db_property.current_valuation,
        appreciation_rate=db_property.appreciation_rate,
        is_primary_residence=bool(db_property.is_primary_residence),
        last_updated=db_property.last_updated,
        loan=loan_data,
        cashflow_schedules=[
            CashflowScheduleCreate(
                name=cf.name,
                amount=cf.amount,
                frequency=cf.frequency,
                start_date=cf.start_date,
                end_date=cf.end_date,
                is_income=bool(cf.is_income),
            )
            for cf in db_cfs
        ],
        events=[],
        installments=[
            InstallmentCreate(
                name=inst.name,
                amount=inst.amount,
                date=str(inst.date) if inst.date else None,
                paid_by=inst.paid_by,
                is_interest=bool(inst.is_interest),
                is_completed=bool(inst.is_completed),
            )
            for inst in db_insts
        ],
        other_expenses=[
            OtherExpenseCreate(
                id=exp.id,
                name=exp.name,
                amount=exp.amount,
                date=str(exp.date) if exp.date else None,
                paid_by=exp.paid_by,
                is_completed=bool(exp.is_completed),
            )
            for exp in db.query(OtherExpense)
            .filter(OtherExpense.property_id == property_id)
            .all()
        ],
    )


@app.delete("/properties/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")

    loans = db.query(Loan).filter(Loan.property_id == property_id).all()
    for loan in loans:
        db.query(OverdraftAccount).filter(OverdraftAccount.loan_id == loan.id).delete()
    db.query(Loan).filter(Loan.property_id == property_id).delete()
    db.query(CashflowSchedule).filter(
        CashflowSchedule.property_id == property_id
    ).delete()
    db.query(Event).filter(Event.property_id == property_id).delete()
    db.delete(db_property)
    db.commit()

    return {"message": "Property deleted successfully"}


@app.get("/properties/", response_model=List[PropertyResponse])
def get_properties(db: Session = Depends(get_db)):
    properties = db.query(Property).all()
    result = []
    for p in properties:
        loans = db.query(Loan).filter(Loan.property_id == p.id).all()
        cashflow_schedules = (
            db.query(CashflowSchedule)
            .filter(CashflowSchedule.property_id == p.id)
            .all()
        )
        events = db.query(Event).filter(Event.property_id == p.id).all()
        installments = (
            db.query(Installment).filter(Installment.property_id == p.id).all()
        )

        loan_data = None
        if loans:
            l = loans[0]
            od_data = None
            overdraft = (
                db.query(OverdraftAccount)
                .filter(OverdraftAccount.loan_id == l.id)
                .first()
            )
            if overdraft:
                od_data = OverdraftAccountCreate(
                    overdraft_amount=overdraft.overdraft_amount,
                    impact_type=overdraft.impact_type,
                )
            loan_data = LoanCreate(
                principal=l.principal,
                interest_rate=l.interest_rate,
                tenure_months=l.tenure_months,
                emi_amount=l.emi_amount,
                start_date=l.start_date,
                pre_emi=bool(l.pre_emi),
                overdraft_account=od_data,
            )

        result.append(
            PropertyResponse(
                id=p.id,
                name=p.name,
                property_type=p.property_type,
                property_status=p.property_status,
                purchase_date=p.purchase_date,
                possession_date=p.possession_date,
                purchase_price=p.purchase_price,
                current_valuation=p.current_valuation,
                appreciation_rate=p.appreciation_rate,
                is_primary_residence=bool(p.is_primary_residence),
                loan=loan_data,
                cashflow_schedules=[
                    CashflowScheduleCreate(
                        name=cf.name,
                        amount=cf.amount,
                        frequency=cf.frequency,
                        start_date=cf.start_date,
                        end_date=cf.end_date,
                        is_income=bool(cf.is_income),
                    )
                    for cf in cashflow_schedules
                ],
                events=[
                    EventCreate(
                        event_type=e.event_type,
                        event_date=e.event_date,
                        description=e.description,
                    )
                    for e in events
                ],
                installments=[
                    InstallmentCreate(
                        name=inst.name,
                        amount=inst.amount,
                        date=str(inst.date) if inst.date else None,
                        paid_by=inst.paid_by,
                        is_interest=bool(inst.is_interest),
                        is_completed=bool(inst.is_completed),
                    )
                    for inst in installments
                ],
            )
        )
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
