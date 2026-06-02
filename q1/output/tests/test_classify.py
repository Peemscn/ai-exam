# -*- coding: utf-8 -*-
"""Unit tests สำหรับ q1 classifier (src/classify.py)
   รัน: .venv/bin/python -m unittest q1/output/tests/test_classify.py -v
"""
import sys, os, json, unittest
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE,"..","src"))
import classify as C
RAW=os.path.join(HERE,"..","data","feedback_raw.json")

class TestStripFiller(unittest.TestCase):
    def test_prefix_and_polite_suffix(self):
        core,polite,askfix=C.strip_filler("อยากฝากทีมงานว่า บอสใหม่มีสกิล one shot บ่อยเกิน รู้สึกไม่แฟร์ ขอบคุณครับ/ค่ะ")
        self.assertIn("one shot",core)
        self.assertNotIn("อยากฝากทีมงานว่า",core)
        self.assertTrue(polite)
    def test_askfix_suffix(self):
        core,polite,askfix=C.strip_filler("ชอบตัวละครใหม่มาก รบกวนช่วยดูให้หน่อย")
        self.assertTrue(askfix)
        self.assertNotIn("รบกวน",core)

class TestClassify(unittest.TestCase):
    def test_gacha_negative_high(self):
        r=C.classify({"player_feedback":"เปิดกาชาไปหลายสิบโรลแล้วยังไม่ได้ตัว rate up รู้สึกท้อมาก","player_segment":"Guild Leader"})
        self.assertEqual(r["sentiment"],"Negative")
        self.assertEqual(r["category"],"Gacha / Monetization")
        self.assertEqual(r["priority"],"High")
    def test_mixed_is_neutral(self):
        r=C.classify({"player_feedback":"Event รอบนี้ธีมน่ารักดี แต่ภารกิจซ้ำเยอะไปหน่อย","player_segment":"Mid Spender"})
        self.assertEqual(r["sentiment"],"Neutral")
        self.assertEqual(r["category"],"Event Feedback")
    def test_positive_core_despite_noise_suffix(self):
        # ชม core แต่ template สุ่ม suffix ขอแก้ → ต้องยัง Positive + confidence Low
        r=C.classify({"player_feedback":"ชอบตัวละครใหม่มาก ดีไซน์ดีและสกิลสนุก รบกวนช่วยดูให้หน่อย","player_segment":"F2P"})
        self.assertEqual(r["sentiment"],"Positive")
        self.assertEqual(r["confidence"],"Low")
    def test_account_login_high(self):
        r=C.classify({"player_feedback":"ล็อกอินด้วย Facebook ไม่ได้ตั้งแต่เมื่อวาน","player_segment":"F2P"})
        self.assertEqual(r["category"],"Account / Payment")
        self.assertEqual(r["priority"],"High")

class TestPriorityWeighting(unittest.TestCase):
    def test_whale_revenue_bumps_to_high(self):
        p,note=C.adjust_priority("Medium","Gacha / Monetization",["revenue"],"Whale","Negative")
        self.assertEqual(p,"High"); self.assertIn("priority",note)
    def test_account_always_high(self):
        p,_=C.adjust_priority("Medium","Account / Payment",["payment"],"F2P","Negative")
        self.assertEqual(p,"High")
    def test_positive_always_low(self):
        p,_=C.adjust_priority("Medium","Positive Feedback",[],"Whale","Positive")
        self.assertEqual(p,"Low")
    def test_f2p_no_revenue_bump(self):
        p,_=C.adjust_priority("Medium","Gacha / Monetization",["revenue"],"F2P","Negative")
        self.assertEqual(p,"Medium")
    def test_new_player_retention_bump(self):
        p,_=C.adjust_priority("Medium","UX / UI",["retention","onboarding"],"New Player","Negative")
        self.assertEqual(p,"High")

class TestFullDatasetCoverage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.exists(RAW): raise unittest.SkipTest("dataset not found")
        with open(RAW,encoding="utf-8") as f: cls.data=json.load(f)
    def test_exactly_300(self):
        self.assertEqual(len(self.data),300)
    def test_zero_unmatched(self):
        unmatched=[r["feedback_id"] for r in self.data if C.classify(r)["matched_theme"]=="(none)"]
        self.assertEqual(unmatched,[])
    def test_every_row_has_all_fields(self):
        for rec in self.data:
            r=C.classify(rec)
            for f in ("sentiment","category","priority","ai_summary","suggested_owner","confidence","review_note"):
                self.assertTrue(r[f], f"{rec['feedback_id']} missing {f}")
    def test_valid_label_values(self):
        for rec in self.data:
            r=C.classify(rec)
            self.assertIn(r["sentiment"],("Positive","Neutral","Negative"))
            self.assertIn(r["priority"],("Low","Medium","High"))
            self.assertIn(r["confidence"],("Low","Medium","High"))

class TestEdgeAndFail(unittest.TestCase):
    def test_unmatched_goes_to_other(self):
        r=C.classify({"player_feedback":"xyzabc ข้อความสุ่มที่ไม่เข้าหมวดไหนเลย 12345","player_segment":"F2P"})
        self.assertEqual(r["category"],"Other")
        self.assertEqual(r["confidence"],"Low")
        self.assertEqual(r["matched_theme"],"(none)")
    def test_empty_feedback_no_crash(self):
        r=C.classify({"player_feedback":"","player_segment":"F2P"})
        self.assertEqual(r["category"],"Other")
    def test_strip_no_filler_unchanged(self):
        core,polite,askfix=C.strip_filler("บอสใหม่มีสกิล one shot")
        self.assertEqual(core,"บอสใหม่มีสกิล one shot")
        self.assertFalse(polite); self.assertFalse(askfix)
    def test_strip_only_filler(self):
        core,_,_=C.strip_filler("อยากฝากทีมงานว่า ขอบคุณครับ/ค่ะ")
        self.assertEqual(core,"")
    def test_priority_no_overbump_when_already_high(self):
        # base High + Whale revenue → ยัง High (ไม่ทะลุ)
        p,_=C.adjust_priority("High","Gacha / Monetization",["revenue"],"Whale","Negative")
        self.assertEqual(p,"High")
    def test_spender_not_bumped(self):
        # Light Spender ไม่ใช่ high-value → revenue ไม่ดัน priority
        p,_=C.adjust_priority("Medium","Reward / Economy",["revenue"],"Light Spender","Negative")
        self.assertEqual(p,"Medium")
    def test_guild_leader_is_high_value(self):
        p,_=C.adjust_priority("Medium","Gacha / Monetization",["revenue"],"Guild Leader","Negative")
        self.assertEqual(p,"High")
    def test_casual_player_no_bump(self):
        # Casual ไม่ใช่ทั้ง high-value/retention → ไม่ดัน
        p,_=C.adjust_priority("Medium","Gameplay / Balance",[],"Casual Player","Negative")
        self.assertEqual(p,"Medium")
    def test_positive_with_revenue_tag_stays_low(self):
        # sentiment Positive ต้อง Low เสมอ ไม่สน tag/segment
        p,_=C.adjust_priority("High","Gacha / Monetization",["revenue"],"Whale","Positive")
        self.assertEqual(p,"Low")

if __name__=="__main__":
    unittest.main(verbosity=2)
