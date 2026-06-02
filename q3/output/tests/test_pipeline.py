# -*- coding: utf-8 -*-
"""Unit tests สำหรับ q3 pipeline logic (foodlib = mirror clean.py + score.py)
   รัน: .venv/bin/python q3/output/tests/test_pipeline.py
   ครอบ success + fail/edge cases
"""
import sys, os, unittest
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","src"))
import foodlib as F

class TestParsePrice(unittest.TestCase):
    def test_range(self):       self.assertEqual(F.parse_price("฿200-400"),(200,400))
    def test_comma(self):       self.assertEqual(F.parse_price("฿200-1,200"),(200,1200))
    def test_plus_openended(self): self.assertEqual(F.parse_price("฿1,000+"),(1000,None))
    def test_single(self):      self.assertEqual(F.parse_price("฿150"),(150,150))
    # fail / edge
    def test_none(self):        self.assertEqual(F.parse_price(None),(None,None))
    def test_empty(self):       self.assertEqual(F.parse_price(""),(None,None))
    def test_symbol_only(self): self.assertEqual(F.parse_price("฿฿"),(None,None))  # ไม่มีตัวเลข

class TestCoords(unittest.TestCase):
    def test_url(self):
        lat,lon=F.coords("https://maps/place/x/data=!3d13.7394!4d100.5601!16s")
        self.assertAlmostEqual(lat,13.7394); self.assertAlmostEqual(lon,100.5601)
    def test_nomatch(self):     self.assertEqual(F.coords("https://no/coords"),(None,None))  # edge
    def test_none(self):        self.assertEqual(F.coords(None),(None,None))                 # edge

class TestHaversine(unittest.TestCase):
    def test_known(self):
        d=F.haversine((13.7373,100.5601),(13.7383,100.5614))  # ~170m
        self.assertTrue(120<=d<=230, f"got {d}")
    def test_zero(self):        self.assertEqual(F.haversine((13.7,100.5),(13.7,100.5)),0)
    def test_none_coord(self):  self.assertIsNone(F.haversine((None,None),(13.7,100.5)))     # edge

class TestParseAddress(unittest.TestCase):
    def test_clean_line(self):
        a=F.parse_address(["อิตาลี · 28 ซอย สุขุมวิท 19","เปิดอยู่ · ปิดเวลา 00:00"])
        self.assertIn("ซอย",a); self.assertNotIn("ปิดเวลา",a)  # ต้องไม่เอา status
    def test_status_only_none(self):
        self.assertIsNone(F.parse_address(["เปิดอยู่ · ปิดเวลา 22:00"]))  # มีแต่ status → None
    def test_empty(self):       self.assertIsNone(F.parse_address([]))                       # edge

class TestScoring(unittest.TestCase):
    def test_rr_high(self):     self.assertGreater(F.s_rating_review({"rating":4.9,"reviews":5000}),20)
    def test_rr_low(self):      self.assertLess(F.s_rating_review({"rating":3.6,"reviews":5}),5)
    def test_rr_clamp(self):    self.assertLessEqual(F.s_rating_review({"rating":5.0,"reviews":999999}),25)  # ไม่เกิน 25
    def test_price_mid(self):   self.assertEqual(F.s_price({"price_min":200,"price_max":600}),15)
    def test_price_expensive(self): self.assertEqual(F.s_price({"price_min":2500,"price_max":3000}),5)
    def test_price_none(self):  self.assertEqual(F.s_price({"price_min":None}),7)             # edge
    def test_travel_near(self): self.assertEqual(F.s_travel({"distance_m":100}),15)
    def test_travel_far(self):  self.assertEqual(F.s_travel({"distance_m":2000}),3)
    def test_travel_none(self): self.assertEqual(F.s_travel({"distance_m":None}),7)           # edge
    def test_group_good(self):  self.assertGreaterEqual(F.s_group({"category":"ภัตตาคารอาหารไทย","reviews":3000}),16)
    def test_group_weak(self):  self.assertLess(F.s_group({"category":"คาเฟ่","reviews":50}),11)
    def test_unique_high(self): self.assertEqual(F.s_unique({"category":"rooftop bar","rating":4.8}),10)
    def test_unique_base(self): self.assertEqual(F.s_unique({"category":"ร้านอาหาร","rating":4.2}),4)
    def test_data_full(self):   self.assertEqual(F.s_data({"address":"a","hours":"b","website":"c","cuisine_osm":"d","lat":1,"category":"e"}),15.0)
    def test_data_partial(self): self.assertLess(F.s_data({"address":"a","category":"b"}),15)  # edge ข้อมูลไม่ครบ

if __name__=="__main__":
    unittest.main(verbosity=2)
