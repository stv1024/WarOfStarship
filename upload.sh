# !/bin/bash
function usage(){
	echo "sh upload.sh target dir"
	echo "eg: sh upload.sh annoark web-mobile"
}
if [ $# -ne 2 ];then
	usage
	exit 1
fi
RUSER=www
TARGET=$1
DIR=$2
if [ ! -d $DIR ];then
	echo "dir $DIR exist"
	exit 1
fi

if [ ! -f $DIR/index.html ];then
	echo "file $DIR/index.html not exist"
	exit 1
fi

# 1. compress file
if [ -f $TARGET.tgz ];then
	echo "rm $TARGET.tgz"
	rm $TARGET.tgz
fi
tar czvf $TARGET.tgz $DIR
# 2. upload
scp $TARGET.tgz $RUSER@172.105.210.148:/home/$RUSER/$TARGET.tgz
# 3. deploy
ssh $RUSER@172.105.210.148 "tar -xf $TARGET.tgz;sh deploy.sh $TARGET $DIR"
