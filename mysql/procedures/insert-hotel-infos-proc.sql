use hotel_data_db;

drop procedure if exists insertHotelInfos;
delimiter //
create procedure insertHotelInfos(
	in hotelId char(18), 
    in hotelName varchar(100),
    in Country varchar(15),
    in Region varchar(52),
    in fullAddr varchar(150),
    in batchId char(19)
)
begin
	declare isHotelAlreadyInDb tinyint;
    
	SELECT IF(COUNT(hotel_name) >= 1, TRUE, FALSE) INTO isHotelAlreadyInDb FROM hotels 
	WHERE hotel_name = hotelName;
    
    IF isHotelAlreadyInDb THEN
		select hotelName as duplicatesName, hotelId as duplicatesId, now() as duplicateAt, batchId as batchId;
    ELSE
		insert into hotels (hotel_id, hotel_name, batch_id)
		values (hotelId, hotelName, batchId);
        
		insert into hotel_addr (hotel_id, country, region, full_addr)
		values (hotelId, Country, Region, fullAddr);
	END IF;
end //
delimiter ;

#call insertHotelInfos('as2dasd1', 'asdas2d', 'asdas3d', 'asd4asd', 'asdas5d', 'asdas2d');